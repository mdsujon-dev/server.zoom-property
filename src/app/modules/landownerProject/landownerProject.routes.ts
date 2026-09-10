import { Router } from "express";

import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { revalidates } from "../../middleware/revalidates";
import validateRequest from "../../middleware/validateRequest";
import { LandownerProjectController } from "./landownerProject.controller";
import { landownerProjectValidation } from "./landownerProject.validation";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("landowners"));

/* -- Public --------------------------------------------------------------
   The website's read. Mounted before "/:id" so "public" is never taken for
   an id. */
router.get("/public", LandownerProjectController.getPublicProjects);

router.get("/", auth(), LandownerProjectController.getAllProjects);
router.get("/:id", auth(), LandownerProjectController.getProjectById);

router.post(
  "/",
  auth(),
  checkPermission("Landowners", "create"),
  validateRequest(landownerProjectValidation.create),
  LandownerProjectController.createProject
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Landowners", "update"),
  validateRequest(landownerProjectValidation.update),
  LandownerProjectController.updateProject
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Landowners", "delete"),
  LandownerProjectController.deleteProject
);

export const LandownerProjectRoutes = router;

export default LandownerProjectRoutes;
