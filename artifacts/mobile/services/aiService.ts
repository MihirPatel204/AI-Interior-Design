import { GoogleGenerativeAI } from "@google/generative-ai";
import * as ImageManipulator from "expo-image-manipulator";

const GEMINI_MODEL = "gemini-3.1-flash";

const ROOM_ANALYSIS_PROMPT =
  "You are a professional interior designer. Look at this room photo. " +
  "1. Identify the current furniture. " +
  "2. Name the interior design style. " +
  "3. Provide 3 specific, actionable tips to rearrange the furniture for better flow.";

export type DesignStyle =
  | "modern"
  | "scandinavian"
  | "industrial"
  | "minimalist"
  | "bohemian"
  | "midcentury";

export interface RoomAnalysis {
  raw: string;
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

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new MissingApiKeyError();
  }
  return key;
}

/**
 * Resize + compress the captured image, then return base64 + mime type
 * suitable for inline submission to Gemini (well under the 20MB limit).
 */
async function prepareImage(
  imageUri: string,
): Promise<{ base64: string; mimeType: string }> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64) {
    throw new Error("Failed to encode image to base64.");
  }

  return { base64: result.base64, mimeType: "image/jpeg" };
}

/**
 * Analyze a room photo with Google Gemini and return the model's text response.
 */
export async function analyzeRoomWithGemini(
  imageUri: string,
): Promise<RoomAnalysis> {
  const apiKey = getApiKey();
  const { base64, mimeType } = await prepareImage(imageUri);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const response = await model.generateContent([
    { text: ROOM_ANALYSIS_PROMPT },
    { inlineData: { data: base64, mimeType } },
  ]);

  const text = response.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    raw: text,
    model: GEMINI_MODEL,
    createdAt: new Date().toISOString(),
  };
}
