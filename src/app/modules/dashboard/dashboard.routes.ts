import express from "express";
import auth from "../../middleware/auth";
import { DashboardControllers } from "./dashboard.controller";

const router = express.Router();

// Any authenticated user can read dashboard stats — fine-grained access is
// handled on the frontend via route-level permission gates.
const adminAuth = auth();

// No `checkPermission` here on purpose: this one endpoint feeds several
// separately-granted cards, so the permission is asked per section inside the
// service and a caller simply gets nulls for the parts they may not see.
router.get("/company", adminAuth, DashboardControllers.getCompanyOverview);

router.get("/overview", adminAuth, DashboardControllers.getOverview);
router.get("/stats", adminAuth, DashboardControllers.getStats);
router.get(
  "/traffic-sources",
  adminAuth,
  DashboardControllers.getTrafficSources
);
router.get(
  "/weekly-activity",
  adminAuth,
  DashboardControllers.getWeeklyActivity
);
router.get("/quick-stats", adminAuth, DashboardControllers.getQuickStats);

export const DashboardRoutes = router;
