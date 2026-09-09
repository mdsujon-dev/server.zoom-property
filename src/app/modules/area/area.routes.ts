import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { AreaController } from "./area.controller";
import { areaValidation } from "./area.validation";

const router = Router();

// Open to any signed-in user: the listing form, the project form and the agent
// form all need the area dropdown.
router.get("/", auth(), AreaController.getAllAreas);
router.get("/:id", auth(), AreaController.getAreaById);

router.post(
  "/",
  auth(),
  checkPermission("Areas", "create"),
  validateRequest(areaValidation.create),
  AreaController.createArea
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Areas", "update"),
  validateRequest(areaValidation.update),
  AreaController.updateArea
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Areas", "delete"),
  AreaController.deleteArea
);

export const AreaRoutes = router;
