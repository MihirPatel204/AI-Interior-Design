import * as ImageManipulator from "expo-image-manipulator";

import { ApiError, apiClient } from "./apiClient";

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
  constructor(message?: string) {
    super(
      message ??
        "The server is missing GEMINI_API_KEY. Ask an admin to set it in Replit Secrets.",
    );
    this.name = "MissingApiKeyError";
  }
}

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
 * Analyze a room photo via our backend (which calls Gemini server-side).
 */
export async function analyzeRoomWithGemini(
  imageUri: string,
): Promise<RoomAnalysis> {
  const { base64, mimeType } = await prepareImage(imageUri);
  try {
    return await apiClient.post<RoomAnalysis>("/api/analyze", {
      imageBase64: base64,
      mimeType,
    });
  } catch (err) {
    if (err instanceof ApiError && err.code === "missing_key") {
      throw new MissingApiKeyError(err.message);
    }
    throw err;
  }
}
