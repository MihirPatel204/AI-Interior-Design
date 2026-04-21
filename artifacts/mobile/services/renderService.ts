import { GoogleGenerativeAI } from "@google/generative-ai";
import * as ImageManipulator from "expo-image-manipulator";

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

export interface RedesignResult {
  base64: string;
  mimeType: string;
  model: string;
  createdAt: string;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "Gemini API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY in Replit Secrets and reload the app.",
    );
    this.name = "MissingApiKeyError";
  }
}

export class SafetyBlockError extends Error {
  constructor() {
    super(
      "This room style is too complex for the AI to process right now. Try a different angle!",
    );
    this.name = "SafetyBlockError";
  }
}

export class NoImageReturnedError extends Error {
  constructor() {
    super(
      "Gemini didn't return an image this time. Try a different style or take a clearer photo of the room.",
    );
    this.name = "NoImageReturnedError";
  }
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new MissingApiKeyError();
  }
  return key;
}

/**
 * Convenience: take a local image URI from the camera, downscale & compress it,
 * and return the base64 string + mime type ready for Gemini.
 */
export async function imageUriToBase64(
  imageUri: string,
): Promise<{ base64: string; mimeType: string }> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!result.base64) {
    throw new Error("Failed to encode image to base64.");
  }
  return { base64: result.base64, mimeType: "image/jpeg" };
}

function buildPrompt(styleChoice: string): string {
  return (
    `Redesign this interior in a ${styleChoice} style. ` +
    `Keep the room layout, walls, and windows exactly the same, ` +
    `but replace all furniture and decor with high-end ${styleChoice} alternatives. ` +
    `Photorealistic, 4K resolution.`
  );
}

/**
 * Generate a redesigned image of the user's room in the chosen style.
 * Returns the new image as base64 (JPEG/PNG depending on what Gemini emits).
 */
export async function generateRedesign(
  base64OriginalImage: string,
  styleChoice: string,
  inputMimeType: string = "image/jpeg",
): Promise<RedesignResult> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      // Image-preview models require image output to be requested explicitly.
      // The cast keeps TS happy on SDK versions that don't yet type this field.
      responseModalities: ["IMAGE", "TEXT"],
    } as unknown as Record<string, unknown>,
  });

  const result = await model.generateContent([
    { text: buildPrompt(styleChoice) },
    { inlineData: { data: base64OriginalImage, mimeType: inputMimeType } },
  ]);

  const response = result.response;

  // 1. Prompt-level safety block.
  const promptFeedback = (response as unknown as {
    promptFeedback?: { blockReason?: string };
  }).promptFeedback;
  if (promptFeedback?.blockReason) {
    throw new SafetyBlockError();
  }

  const candidates = response.candidates ?? [];
  const candidate = candidates[0];

  // 2. Candidate-level safety block.
  if (
    candidate?.finishReason === "SAFETY" ||
    candidate?.finishReason === "PROHIBITED_CONTENT" ||
    candidate?.finishReason === "BLOCKLIST"
  ) {
    throw new SafetyBlockError();
  }

  // 3. Pull the first inline image part.
  const parts = candidate?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as { inlineData?: { data?: string; mimeType?: string } })
      .inlineData;
    if (inline?.data) {
      return {
        base64: inline.data,
        mimeType: inline.mimeType ?? "image/png",
        model: IMAGE_MODEL,
        createdAt: new Date().toISOString(),
      };
    }
  }

  throw new NoImageReturnedError();
}
