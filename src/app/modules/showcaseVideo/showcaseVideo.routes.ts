import { Router } from "express";

import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { revalidates } from "../../middleware/revalidates";
import validateRequest from "../../middleware/validateRequest";
import { ShowcaseVideoController } from "./showcaseVideo.controller";
import { showcaseVideoValidation } from "./showcaseVideo.validation";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("videos"));

/* -- Public --------------------------------------------------------------
   The website's read. Mounted before "/:id" so "public" is never taken for
   an id. */
router.get("/public", ShowcaseVideoController.getPublicVideos);

router.get("/", auth(), ShowcaseVideoController.getAllVideos);
router.get("/:id", auth(), ShowcaseVideoController.getVideoById);

router.post(
  "/",
  auth(),
  checkPermission("Showcase Videos", "create"),
  validateRequest(showcaseVideoValidation.create),
  ShowcaseVideoController.createVideo
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Showcase Videos", "update"),
  validateRequest(showcaseVideoValidation.update),
  ShowcaseVideoController.updateVideo
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Showcase Videos", "delete"),
  ShowcaseVideoController.deleteVideo
);

export const ShowcaseVideoRoutes = router;

export default ShowcaseVideoRoutes;
