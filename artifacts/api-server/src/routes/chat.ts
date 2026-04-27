import { Router, type IRouter } from "express";

import {
  chatFurnitureAssistant,
  MissingGeminiKeyError,
  type ChatTurn,
} from "../lib/gemini";
import { getUsage, incrementChat } from "../lib/usage";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

const MAX_MESSAGE_LENGTH = 2000;

type RawHistoryTurn = {
  role?: unknown;
  content?: unknown;
};

function parseHistory(history: unknown): ChatTurn[] {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-20)
    .map((item) => {
      const turn = item as RawHistoryTurn;
      const role = turn.role;
      const content = turn.content;

      if (
        (role === "user" || role === "assistant") &&
        typeof content === "string" &&
        content.trim().length > 0
      ) {
        return {
          role,
          content: content.trim(),
        } satisfies ChatTurn;
      }

      return null;
    })
    .filter((turn): turn is ChatTurn => Boolean(turn));
}

router.post(
  "/chat",
  rateLimit({ capacity: 14, refillPerMinute: 10, keyPrefix: "chat" }),
  async (req, res) => {
    const deviceId = (req.header("x-device-id") ?? "anonymous") as string;

    const { message, selectedStyle, roomAnalysis, history } =
      (req.body ?? {}) as {
        message?: unknown;
        selectedStyle?: unknown;
        roomAnalysis?: unknown;
        history?: unknown;
      };

    if (typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({
        error: "invalid_request",
        message: "message is required.",
      });
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: "invalid_request",
        message: `message is too long (max ${MAX_MESSAGE_LENGTH} chars).`,
      });
      return;
    }

    if (typeof selectedStyle !== "undefined" && typeof selectedStyle !== "string") {
      res.status(400).json({
        error: "invalid_request",
        message: "selectedStyle must be a string when provided.",
      });
      return;
    }

    if (typeof roomAnalysis !== "undefined" && typeof roomAnalysis !== "string") {
      res.status(400).json({
        error: "invalid_request",
        message: "roomAnalysis must be a string when provided.",
      });
      return;
    }

    if (typeof history !== "undefined" && !Array.isArray(history)) {
      res.status(400).json({
        error: "invalid_request",
        message: "history must be an array when provided.",
      });
      return;
    }

    const normalizedSelectedStyle =
      typeof selectedStyle === "string" && selectedStyle.trim().length > 0
        ? selectedStyle.trim()
        : undefined;
    const normalizedRoomAnalysis =
      typeof roomAnalysis === "string" && roomAnalysis.trim().length > 0
        ? roomAnalysis.trim()
        : undefined;

    try {
      const result = await chatFurnitureAssistant({
        message: message.trim(),
        selectedStyle: normalizedSelectedStyle,
        roomAnalysis: normalizedRoomAnalysis,
        history: parseHistory(history),
      });

      incrementChat(deviceId);
      res.json({ ...result, usage: getUsage(deviceId) });
    } catch (err) {
      if (err instanceof MissingGeminiKeyError) {
        res.status(503).json({
          error: "missing_key",
          message: err.message,
        });
        return;
      }

      req.log?.error({ err }, "chat failed");
      res.status(500).json({
        error: "chat_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

export default router;
