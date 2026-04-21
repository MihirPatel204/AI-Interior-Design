import { Router, type IRouter } from "express";
import { getUsage, setPro } from "../lib/usage";

const router: IRouter = Router();

router.get("/usage", (req, res) => {
  const deviceId = (req.header("x-device-id") ??
    (req.query.deviceId as string | undefined) ??
    "anonymous") as string;
  res.json(getUsage(deviceId));
});

router.post("/usage/pro", (req, res) => {
  const deviceId = (req.header("x-device-id") ?? "anonymous") as string;
  const { pro } = (req.body ?? {}) as { pro?: boolean };
  if (typeof pro !== "boolean") {
    res.status(400).json({
      error: "invalid_request",
      message: "pro (boolean) is required.",
    });
    return;
  }
  setPro(deviceId, pro);
  res.json(getUsage(deviceId));
});

export default router;
