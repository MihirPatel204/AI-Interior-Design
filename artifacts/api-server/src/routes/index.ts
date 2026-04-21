import { Router, type IRouter } from "express";
import analyzeRouter from "./analyze";
import healthRouter from "./health";
import renderRouter from "./render";
import stylesRouter from "./styles";
import usageRouter from "./usage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stylesRouter);
router.use(usageRouter);
router.use(analyzeRouter);
router.use(renderRouter);

export default router;
