import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidation } from "./project.validation";
import { revalidates } from "../../middleware/revalidates";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("projects"));

// Open to any signed-in user: the listing form needs the project dropdown.
/* ── Public ─────────────────────────────────────────────────────────────
   The website's reads. Mounted before "/:id" so "public" is never taken
   for an id. */
router.get("/public", ProjectController.getPublicProjects);
router.get("/public/:slug", ProjectController.getProjectBySlug);

router.get("/", auth(), ProjectController.getAllProjects);
router.get("/:id", auth(), ProjectController.getProjectById);

router.post(
  "/",
  auth(),
  checkPermission("Projects", "create"),
  validateRequest(projectValidation.create),
  ProjectController.createProject
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Projects", "update"),
  validateRequest(projectValidation.update),
  ProjectController.updateProject
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Projects", "delete"),
  ProjectController.deleteProject
);

export const ProjectRoutes = router;
