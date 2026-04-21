import { Router, type IRouter } from "express";
import { STYLES } from "../lib/styles";

const router: IRouter = Router();

router.get("/styles", (_req, res) => {
  res.json({ styles: STYLES, count: STYLES.length });
});

export default router;
