import { GoogleGenerativeAI } from "@google/generative-ai";
import { STYLES } from "./styles";

const GEMINI_TEXT_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
] as const;

const GEMINI_IMAGE_MODEL_CANDIDATES = [
  "gemini-2.5-flash-image"
] as const;

const DEFAULT_TEXT_MODEL = GEMINI_TEXT_MODEL_CANDIDATES[0];
const DEFAULT_IMAGE_MODEL = GEMINI_IMAGE_MODEL_CANDIDATES[0];

export class MissingGeminiKeyError extends Error {
  constructor() {
    super(
      "Server is missing GEMINI_API_KEY. Set it in Replit Secrets for this workspace.",
    );
    this.name = "MissingGeminiKeyError";
  }
}

export class SafetyBlockError extends Error {
  constructor() {
    super(
      "The AI declined this image. Try another photo or a different style.",
    );
    this.name = "SafetyBlockError";
  }
}

export class NoImageReturnedError extends Error {
  constructor() {
    super(
      "The AI didn't return an image. Try a clearer room photo or another style.",
    );
    this.name = "NoImageReturnedError";
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface FurnitureChatInput {
  message: string;
  selectedStyle?: string;
  roomAnalysis?: string;
  history?: ChatTurn[];
}

function getApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new MissingGeminiKeyError();
  }
  return key;
}

export function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

function isUnavailableModelError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("not supported") ||
    message.includes("unknown model")
  );
}

async function runWithModelFallback<T>(
  modelNames: readonly string[],
  fn: (modelName: string) => Promise<T>,
): Promise<{ modelName: string; result: T }> {
  let lastError: unknown;

  for (const modelName of modelNames) {
    try {
      const result = await fn(modelName);
      return { modelName, result };
    } catch (error) {
      lastError = error;
      if (!isUnavailableModelError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No compatible Gemini model was available.");
}

const MAX_CHAT_TURNS = 12;
const MAX_CHAT_MESSAGE_CHARS = 1200;
const MAX_CHAT_CONTEXT_CHARS = 1600;

function clampText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

function sanitizeHistory(history: ChatTurn[] | undefined): ChatTurn[] {
  if (!history || history.length === 0) return [];

  const cleaned = history
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-MAX_CHAT_TURNS)
    .map((item) => ({
      role: item.role,
      content: clampText(item.content.trim(), MAX_CHAT_MESSAGE_CHARS),
    }));

  return cleaned;
}

function resolveStyle(selectedStyle: string | undefined): string | undefined {
  if (!selectedStyle || selectedStyle.trim().length === 0) return undefined;
  const normalized = selectedStyle.trim().toLowerCase();

  const match = STYLES.find(
    (style) =>
      style.id.toLowerCase() === normalized ||
      style.name.toLowerCase() === normalized,
  );

  if (match) {
    return `${match.name} (${match.id})`;
  }
  return selectedStyle.trim();
}

function buildStyleKnowledge(): string {
  return STYLES.map((style) => {
    const tags = style.keywords.join(", ");
    return `- ${style.name} [${style.id}]: ${style.description} Keywords: ${tags}.`;
  }).join("\n");
}

function buildFurnitureChatPrompt(input: FurnitureChatInput): string {
  const styleCatalog = buildStyleKnowledge();
  const normalizedHistory = sanitizeHistory(input.history);
  const resolvedStyle = resolveStyle(input.selectedStyle);
  const roomAnalysis = input.roomAnalysis
    ? clampText(input.roomAnalysis.trim(), MAX_CHAT_CONTEXT_CHARS)
    : "";
  const userMessage = clampText(input.message.trim(), MAX_CHAT_MESSAGE_CHARS);

  const transcript = normalizedHistory
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");

  const sections: string[] = [
    "You are InteriorAI's furniture and interior design assistant.",
    "Stay focused on furniture, room layout, decor, style selection, lighting, materials, and color palettes.",
    "If the user asks something unrelated to interior design, briefly redirect them back to furniture and room design help.",
    "Give practical, specific advice with clear actions. Prefer short bullet points when giving multi-step guidance.",
    "Use the style catalog below as authoritative context.",
    "",
    "Style catalog:",
    styleCatalog,
  ];

  if (resolvedStyle) {
    sections.push("", `User selected style: ${resolvedStyle}`);
  }

  if (roomAnalysis) {
    sections.push("", "Room analysis context:", roomAnalysis);
  }

  if (transcript) {
    sections.push("", "Recent conversation:", transcript);
  }

  sections.push(
    "",
    "Latest user request:",
    userMessage,
    "",
    "Answer format:",
    "- Keep the tone warm and professional.",
    "- Give concrete furniture recommendations, placements, and reasons.",
    "- Mention budget-friendly alternatives when relevant.",
  );

  return sections.join("\n");
}

const ROOM_ANALYSIS_PROMPT =
  "You are a professional interior designer. Look at this room photo. " +
  "1. Identify the current furniture. " +
  "2. Name the interior design style. " +
  "3. Provide 3 specific, actionable tips to rearrange the furniture for better flow.";

export async function analyzeRoom(
  imageBase64: string,
  mimeType: string,
): Promise<{ raw: string; model: string; createdAt: string }> {
  const genAI = getGeminiClient();

  const { modelName, result } = await runWithModelFallback(
    GEMINI_TEXT_MODEL_CANDIDATES,
    async (candidate) => {
      const model = genAI.getGenerativeModel({ model: candidate });
      const response = await model.generateContent([
        { text: ROOM_ANALYSIS_PROMPT },
        { inlineData: { data: imageBase64, mimeType } },
      ]);
      return response;
    },
  );

  const text = result.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty response.");
  }
  return {
    raw: text,
    model: modelName,
    createdAt: new Date().toISOString(),
  };
}

export async function chatFurnitureAssistant(
  input: FurnitureChatInput,
): Promise<{ reply: string; model: string; createdAt: string }> {
  const genAI = getGeminiClient();

  const { modelName, result } = await runWithModelFallback(
    GEMINI_TEXT_MODEL_CANDIDATES,
    async (candidate) => {
      const model = genAI.getGenerativeModel({ model: candidate });
      const response = await model.generateContent([
        { text: buildFurnitureChatPrompt(input) },
      ]);
      return response;
    },
  );

  const text = result.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty chat response.");
  }

  return {
    reply: text.trim(),
    model: modelName,
    createdAt: new Date().toISOString(),
  };
}

function buildRedesignPrompt(style: string): string {
  return (
    `Redesign this interior in a ${style} style. ` +
    `Keep the room layout, walls, and windows exactly the same, ` +
    `but replace all furniture and decor with high-end ${style} alternatives. ` +
    `Photorealistic, 4K resolution.`
  );
}

export async function renderRedesign(
  imageBase64: string,
  mimeType: string,
  style: string,
): Promise<{
  base64: string;
  mimeType: string;
  model: string;
  createdAt: string;
}> {
  const genAI = getGeminiClient();

  const { modelName, result } = await runWithModelFallback(
    GEMINI_IMAGE_MODEL_CANDIDATES,
    async (candidate) => {
      const model = genAI.getGenerativeModel({
        model: candidate,
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        } as unknown as Record<string, unknown>,
      });

      const response = await model.generateContent([
        { text: buildRedesignPrompt(style) },
        { inlineData: { data: imageBase64, mimeType } },
      ]);

      return response;
    },
  );

  const response = result.response;
  const promptFeedback = (
    response as unknown as { promptFeedback?: { blockReason?: string } }
  ).promptFeedback;
  if (promptFeedback?.blockReason) {
    throw new SafetyBlockError();
  }

  const candidates = response.candidates ?? [];
  const candidate = candidates[0];
  if (
    candidate?.finishReason === "SAFETY" ||
    candidate?.finishReason === "PROHIBITED_CONTENT" ||
    candidate?.finishReason === "BLOCKLIST"
  ) {
    throw new SafetyBlockError();
  }

  const parts = candidate?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as { inlineData?: { data?: string; mimeType?: string } })
      .inlineData;
    if (inline?.data) {
      return {
        base64: inline.data,
        mimeType: inline.mimeType ?? "image/png",
        model: modelName,
        createdAt: new Date().toISOString(),
      };
    }
  }
  throw new NoImageReturnedError();
}
