import { ApiError, apiClient, getApiBaseUrl } from "./apiClient";

export type ChatRole = "user" | "assistant";

export interface ChatHistoryTurn {
  role: ChatRole;
  content: string;
}

export interface FurnitureChatRequest {
  message: string;
  selectedStyle?: string;
  roomAnalysis?: string;
  history?: ChatHistoryTurn[];
}

export interface FurnitureChatResponse {
  reply: string;
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

export class RateLimitedError extends Error {
  retryAfterSec?: number;

  constructor(message?: string, retryAfterSec?: number) {
    super(message ?? "Too many chat requests. Please wait a moment.");
    this.name = "RateLimitedError";
    this.retryAfterSec = retryAfterSec;
  }
}

export class NetworkRequestError extends Error {
  constructor(message?: string) {
    super(message ?? "Unable to reach the API server.");
    this.name = "NetworkRequestError";
  }
}

export async function askFurnitureChatbot(
  input: FurnitureChatRequest,
): Promise<FurnitureChatResponse> {
  try {
    return await apiClient.post<FurnitureChatResponse>("/api/chat", {
      message: input.message,
      selectedStyle: input.selectedStyle,
      roomAnalysis: input.roomAnalysis,
      history: input.history,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      switch (err.code) {
        case "missing_key":
          throw new MissingApiKeyError(err.message);
        case "rate_limited": {
          const retry = (err.payload as { retryAfterSec?: number } | null)
            ?.retryAfterSec;
          throw new RateLimitedError(err.message, retry);
        }
      }
    }

    if (
      err instanceof Error &&
      /network request failed|failed to fetch/i.test(err.message)
    ) {
      const apiBase = getApiBaseUrl();
      throw new NetworkRequestError(
        `Cannot reach API at ${apiBase}. Verify the server is running and EXPO_PUBLIC_API_URL is correct for this device.`,
      );
    }

    throw err;
  }
}
