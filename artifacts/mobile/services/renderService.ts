import * as ImageManipulator from "expo-image-manipulator";

import { ApiError, apiClient } from "./apiClient";

export interface RedesignResult {
  base64: string;
  mimeType: string;
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

export class SafetyBlockError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "This room style is too complex for the AI to process right now. Try a different angle!",
    );
    this.name = "SafetyBlockError";
  }
}

export class NoImageReturnedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Gemini didn't return an image this time. Try a different style or take a clearer photo of the room.",
    );
    this.name = "NoImageReturnedError";
  }
}

export class QuotaExceededError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Free render limit reached. Upgrade to Pro for unlimited redesigns.",
    );
    this.name = "QuotaExceededError";
  }
}

export class RateLimitedError extends Error {
  retryAfterSec?: number;
  constructor(message?: string, retryAfterSec?: number) {
    super(message ?? "You're sending requests too quickly. Please wait a bit.");
    this.name = "RateLimitedError";
    this.retryAfterSec = retryAfterSec;
  }
}

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

/**
 * Generate a redesigned image via our backend (which calls Gemini server-side).
 * The backend also enforces per-device quota + rate limits.
 */
export async function generateRedesign(
  base64OriginalImage: string,
  styleChoice: string,
  inputMimeType: string = "image/jpeg",
  pro: boolean = false,
): Promise<RedesignResult> {
  try {
    const result = await apiClient.post<RedesignResult>("/api/render", {
      imageBase64: base64OriginalImage,
      mimeType: inputMimeType,
      style: styleChoice,
      pro,
    });
    return result;
  } catch (err) {
    if (err instanceof ApiError) {
      switch (err.code) {
        case "missing_key":
          throw new MissingApiKeyError(err.message);
        case "safety_block":
          throw new SafetyBlockError(err.message);
        case "no_image":
          throw new NoImageReturnedError(err.message);
        case "quota_exceeded":
          throw new QuotaExceededError(err.message);
        case "rate_limited": {
          const retry = (err.payload as { retryAfterSec?: number } | null)
            ?.retryAfterSec;
          throw new RateLimitedError(err.message, retry);
        }
      }
    }
    throw err;
  }
}
