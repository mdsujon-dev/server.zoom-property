import { Router } from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import checkPermission from "../../middleware/permission";
import { upload } from "../../middleware/upload";
import { MediaLibraryControllers } from "./media-library.controller";
import { mediaValidation } from "./media-library.validation";

const router = Router();

router.get(
  "/",
  auth(),
  checkPermission("Media Library", "view"),
  MediaLibraryControllers.getAllMedia
);

router.post(
  "/",
  auth(),
  checkPermission("Media Library", "create"),
  upload.single("file"),
  MediaLibraryControllers.uploadMedia
);

router.patch(
  "/rename",
  auth(),
  checkPermission("Media Library", "create"),
  validateRequest(mediaValidation.rename),
  MediaLibraryControllers.renameImage
);

router.patch(
  "/move",
  auth(),
  checkPermission("Media Library", "create"),
  validateRequest(mediaValidation.move),
  MediaLibraryControllers.moveMedia
);

/**
 * The bytes of one file, served through this API so they arrive under its CORS
 * policy — the public bucket URL sends none, which is why a logo shows on
 * screen and then goes missing from the certificate PDF.
 *
 * Open, like the bucket it reads from. An `<img>` tag cannot carry a bearer
 * token, so requiring one here would break the very thing this exists for; and
 * every byte it serves is already fetchable by anyone who has the public URL.
 * Guarding the copy while leaving the original open would be theatre.
 */
router.get("/file/:id", MediaLibraryControllers.getMediaFile);

// ── Usage info route ────────────────────────────────────────────────────────────
router.get(
  "/usage/:id",
  auth(),
  checkPermission("Media Library", "view"),
  MediaLibraryControllers.getMediaUsage
);

// ── Media Bin routes — MUST come before the catch-all DELETE regex ────────────
router.get(
  "/bin",
  auth(),
  checkPermission("Media Bin", "view"),
  MediaLibraryControllers.getBinnedMedia
);

router.patch(
  "/bin/bulk-restore",
  auth(),
  checkPermission("Media Bin", "restore"),
  validateRequest(mediaValidation.keys),
  MediaLibraryControllers.bulkRestoreMedia
);

router.delete(
  "/bin/bulk-purge",
  auth(),
  checkPermission("Media Bin", "delete"),
  validateRequest(mediaValidation.keys),
  MediaLibraryControllers.bulkPermanentDeleteMedia
);

router.patch(
  /^\/restore\/(.+)$/,
  auth(),
  checkPermission("Media Bin", "restore"),
  MediaLibraryControllers.restoreMedia
);

router.delete(
  /^\/purge\/(.+)$/,
  auth(),
  checkPermission("Media Bin", "delete"),
  MediaLibraryControllers.permanentDeleteMedia
);

// ── Catch-all soft-delete — keep LAST so specific routes above take priority ──
router.delete(
  /^\/(.+)$/,
  auth(),
  checkPermission("Media Library", "delete"),
  MediaLibraryControllers.deleteMedia
);

export const MediaLibraryRoutes = router;
