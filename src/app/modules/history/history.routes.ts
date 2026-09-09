import { Router } from "express";
import auth from "../../middleware/auth";
import { HistoryController } from "./history.controller";

const router = Router();

router.get("/:entity/:id", auth(), HistoryController.getRecordHistory);

export const HistoryRoutes = router;
