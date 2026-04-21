import { Router, type IRouter } from "express";

import { analyzeRoom, MissingGeminiKeyError } from "../lib/gemini";
import { incrementAnalysis } from "../lib/usage";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

router.post(
  "/analyze",
  rateLimit({ capacity: 6, refillPerMinute: 3, keyPrefix: "analyze" }),
  async (req, res) => {
    const deviceId = (req.header("x-device-id") ?? "anonymous") as string;
    const { imageBase64, mimeType } = (req.body ?? {}) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({
        error: "invalid_request",
        message: "imageBase64 is required.",
      });
      return;
    }

    try {
      const result = await analyzeRoom(imageBase64, mimeType ?? "image/jpeg");
      incrementAnalysis(deviceId);
      res.json(result);
    } catch (err) {
      if (err instanceof MissingGeminiKeyError) {
        res.status(503).json({
          error: "missing_key",
          message: err.message,
        });
        return;
      }
      req.log?.error({ err }, "analyze failed");
      res.status(500).json({
        error: "analyze_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

export default router;
