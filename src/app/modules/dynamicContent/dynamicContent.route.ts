import express from 'express';
import auth from '../../middleware/auth';
import checkPermission from '../../middleware/permission';
import validateRequest from '../../middleware/validateRequest';
import { revalidates } from '../../middleware/revalidates';
import { DynamicContentController } from './dynamicContent.controller';
import { DynamicContentValidation } from './dynamicContent.validation';

const router = express.Router();

// Every other module does this and this one did not, which meant a save in the
// panel changed the database and nothing else: the website kept serving the
// page it had already built, and the edit only surfaced whenever the backstop
// refresh happened to come round. Copy edited here is the *most* cached thing
// on the site, so it was the worst place to leave out.
router.use(revalidates('cms'));

// ─── Public reads — used by the frontend ────────────────────────────────
// GET /dynamic-content/map?group=home        → { key: doc }
router.get('/map', DynamicContentController.getContentsMap);
// GET /dynamic-content/by-group/:group       → doc[]
router.get('/by-group/:group', DynamicContentController.getContentsByGroup);

// ─── Admin — list + history ─────────────────────────────────────────────
router.get(
  '/',
  auth(),
  checkPermission('Dynamic Content', 'view'),
  DynamicContentController.getAllContents
);

router.get(
  '/:key/history',
  auth(),
  checkPermission('Dynamic Content', 'view'),
  DynamicContentController.getContentHistory
);

// ─── Admin — writes ─────────────────────────────────────────────────────
router.put(
  '/upsert',
  auth(),
  checkPermission('Dynamic Content', 'update'),
  validateRequest(DynamicContentValidation.upsertZodSchema),
  DynamicContentController.upsertContent
);

router.put(
  '/bulk-upsert',
  auth(),
  checkPermission('Dynamic Content', 'update'),
  validateRequest(DynamicContentValidation.bulkUpsertZodSchema),
  DynamicContentController.bulkUpsertContents
);

router.delete(
  '/bulk-delete',
  auth(),
  checkPermission('Dynamic Content', 'delete'),
  validateRequest(DynamicContentValidation.bulkDeleteZodSchema),
  DynamicContentController.bulkDeleteContents
);

router.delete(
  '/:key',
  auth(),
  checkPermission('Dynamic Content', 'delete'),
  DynamicContentController.deleteContent
);

export const DynamicContentRoutes = router;
