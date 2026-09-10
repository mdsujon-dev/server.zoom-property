import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { AreaController } from "./area.controller";
import { areaValidation } from "./area.validation";
import { revalidates } from "../../middleware/revalidates";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("areas"));

// Open to any signed-in user: the listing form, the project form and the agent
// form all need the area dropdown.
/* ── Public ─────────────────────────────────────────────────────────────
   The website's read. Mounted before "/:id" so "public" is never taken
   for an id. */
router.get("/public", AreaController.getPublicAreas);

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
