import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ReviewController } from "./review.controller";
import { reviewValidation } from "./review.validation";
import { revalidates } from "../../middleware/revalidates";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("reviews"));

/* ── Public ─────────────────────────────────────────────────────────────
   The website's read. Mounted before "/:id" so "public" is never taken
   for an id. */
router.get("/public", ReviewController.getPublicReviews);

router.get("/", auth(), ReviewController.getAllReviews);
router.get("/:id", auth(), ReviewController.getReviewById);

router.post(
  "/",
  auth(),
  checkPermission("Reviews", "create"),
  validateRequest(reviewValidation.create),
  ReviewController.createReview
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Reviews", "update"),
  validateRequest(reviewValidation.update),
  ReviewController.updateReview
);

// Publishing is what this screen is for, so it gets its own address rather than
// riding on a general edit — the log then says who put a quote on the website.
router.patch(
  "/:id/publish",
  auth(),
  checkPermission("Reviews", "update"),
  ReviewController.togglePublished
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Reviews", "delete"),
  ReviewController.deleteReview
);

export const ReviewRoutes = router;
