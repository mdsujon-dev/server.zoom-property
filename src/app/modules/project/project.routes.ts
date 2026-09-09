import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidation } from "./project.validation";

const router = Router();

// Open to any signed-in user: the listing form needs the project dropdown.
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
