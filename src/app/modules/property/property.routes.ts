import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { PropertyController } from "./property.controller";
import { propertyValidation } from "./property.validation";
import { revalidates } from "../../middleware/revalidates";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("properties"));

/* ── Public ─────────────────────────────────────────────────────────────
   The website's read. Unauthenticated on purpose, and answered only for
   listings that are actually on the market — see `getPropertyBySlug`. Mounted
   first so "public" is never read as an id. */
router.get("/public", PropertyController.getPublicProperties);
router.get("/public/:slug", PropertyController.getPropertyBySlug);

/* ── Managed option lists ───────────────────────────────────────────────
   `:kind` is `amenities` today. Mounted before "/:id" so the word is never
   read as a listing id. */
router.get("/options/:kind", auth(), PropertyController.listOptions);
router.post(
  "/options/:kind",
  auth(),
  checkPermission("Properties", "create"),
  validateRequest(propertyValidation.createOption),
  PropertyController.createOption
);
router.patch(
  "/options/:kind/:id",
  auth(),
  checkPermission("Properties", "update"),
  validateRequest(propertyValidation.updateOption),
  PropertyController.updateOption
);
router.delete(
  "/options/:kind/:id",
  auth(),
  checkPermission("Properties", "delete"),
  PropertyController.deleteOption
);

/* ── Listings ───────────────────────────────────────────────────────────
   Reads are open to any signed-in user: the enquiry, project and dashboard
   screens all need the listing dropdown. The service still scopes an agent to
   their own book, so "open to everyone" does not mean "everything to
   everyone". */
router.get("/", auth(), PropertyController.getAllProperties);
router.get("/:id", auth(), PropertyController.getPropertyById);

router.post(
  "/",
  auth(),
  checkPermission("Properties", "create"),
  validateRequest(propertyValidation.create),
  PropertyController.createProperty
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Properties", "update"),
  validateRequest(propertyValidation.update),
  PropertyController.updateProperty
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Properties", "update"),
  validateRequest(propertyValidation.changeStatus),
  PropertyController.changeStatus
);

// Featuring is a marketing decision, not an edit to the listing, but it is the
// same people making it — so it rides on `update` rather than inventing a
// permission nobody would think to tick.
router.patch(
  "/:id/featured",
  auth(),
  checkPermission("Properties", "update"),
  PropertyController.toggleFeatured
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Properties", "delete"),
  PropertyController.deleteProperty
);

export const PropertyRoutes = router;
