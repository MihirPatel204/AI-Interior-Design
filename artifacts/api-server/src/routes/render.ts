import { Router, type IRouter } from "express";

import {
  MissingGeminiKeyError,
  NoImageReturnedError,
  renderRedesign,
  SafetyBlockError,
} from "../lib/gemini";
import {
  canRender,
  getUsage,
  incrementRender,
  setPro,
} from "../lib/usage";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

router.post(
  "/render",
  rateLimit({ capacity: 3, refillPerMinute: 2, keyPrefix: "render" }),
  async (req, res) => {
    const deviceId = (req.header("x-device-id") ?? "anonymous") as string;
    const { imageBase64, mimeType, style, pro } = (req.body ?? {}) as {
      imageBase64?: string;
      mimeType?: string;
      style?: string;
      pro?: boolean;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({
        error: "invalid_request",
        message: "imageBase64 is required.",
      });
      return;
    }
    if (!style || typeof style !== "string") {
      res.status(400).json({
        error: "invalid_request",
        message: "style is required.",
      });
      return;
    }

    // Trust the client-reported Pro flag for now (RevenueCat receipt
    // verification would replace this in a production hardening pass).
    if (typeof pro === "boolean") setPro(deviceId, pro);

    if (!canRender(deviceId)) {
      const usage = getUsage(deviceId);
      res.status(402).json({
        error: "quota_exceeded",
        message: "Free render limit reached. Upgrade to Pro for unlimited.",
        usage,
      });
      return;
    }

    try {
      const result = await renderRedesign(
        imageBase64,
        mimeType ?? "image/jpeg",
        style,
      );
      incrementRender(deviceId);
      res.json({ ...result, usage: getUsage(deviceId) });
    } catch (err) {
      if (err instanceof MissingGeminiKeyError) {
        res.status(503).json({ error: "missing_key", message: err.message });
        return;
      }
      if (err instanceof SafetyBlockError) {
        res.status(422).json({ error: "safety_block", message: err.message });
        return;
      }
      if (err instanceof NoImageReturnedError) {
        res.status(422).json({ error: "no_image", message: err.message });
        return;
      }
      req.log?.error({ err }, "render failed");
      res.status(500).json({
        error: "render_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

export default router;
