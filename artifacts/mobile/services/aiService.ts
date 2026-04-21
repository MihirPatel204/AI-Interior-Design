/**
 * InteriorAI - AI service layer.
 *
 * This module is the single place where the app talks to AI providers
 * for interior design generation, style transfer, and room analysis.
 *
 * Wire real providers here when ready (e.g., a backend route that calls
 * an image generation model). Until then these functions throw so callers
 * fail loudly instead of silently rendering fake results.
 */

export type DesignStyle =
  | "modern"
  | "scandinavian"
  | "industrial"
  | "minimalist"
  | "bohemian"
  | "midcentury";

export interface RedesignRequest {
  imageUri: string;
  style: DesignStyle;
  prompt?: string;
}

export interface RedesignResult {
  resultImageUri: string;
  style: DesignStyle;
  createdAt: string;
}

export async function redesignRoom(
  _request: RedesignRequest,
): Promise<RedesignResult> {
  throw new Error(
    "redesignRoom is not implemented yet. Connect an AI provider in services/aiService.ts.",
  );
}

export async function analyzeRoom(_imageUri: string): Promise<{
  detectedStyle: DesignStyle;
  notes: string;
}> {
  throw new Error(
    "analyzeRoom is not implemented yet. Connect an AI provider in services/aiService.ts.",
  );
}
