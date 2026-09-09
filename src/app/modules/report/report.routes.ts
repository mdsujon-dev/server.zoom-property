import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { ReportController } from "./report.controller";

const router = Router();

/**
 * Each report is gated by the module it reports on, not by a "Reports"
 * permission of its own: someone who may not see the ledger must not be able to
 * read it through a report either, and an accountant who may see it should not
 * need a second grant to do so.
 */
router.get(
  "/financial",
  auth(),
  checkPermission("Income & Expense", "view"),
  ReportController.financial
);

// The ledger written as a balancing cash book, and what it came to.
router.get(
  "/cash-book",
  auth(),
  checkPermission("Income & Expense", "view"),
  ReportController.cashBook
);

router.get(
  "/profit-loss",
  auth(),
  checkPermission("Income & Expense", "view"),
  ReportController.profitLoss
);

export const ReportRoutes = router;
