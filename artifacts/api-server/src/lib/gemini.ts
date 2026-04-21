import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_ANALYSIS_MODEL = "gemini-3.1-flash";
export const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";

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
  const model = genAI.getGenerativeModel({ model: GEMINI_ANALYSIS_MODEL });

  const response = await model.generateContent([
    { text: ROOM_ANALYSIS_PROMPT },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = response.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty response.");
  }
  return {
    raw: text,
    model: GEMINI_ANALYSIS_MODEL,
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
  const model = genAI.getGenerativeModel({
    model: GEMINI_IMAGE_MODEL,
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    } as unknown as Record<string, unknown>,
  });

  const result = await model.generateContent([
    { text: buildRedesignPrompt(style) },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

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
        model: GEMINI_IMAGE_MODEL,
        createdAt: new Date().toISOString(),
      };
    }
  }
  throw new NoImageReturnedError();
}
