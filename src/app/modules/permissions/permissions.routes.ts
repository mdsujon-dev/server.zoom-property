import { Router } from 'express';
import auth from '../../middleware/auth';
import checkPermission from '../../middleware/permission';
import validateRequest from '../../middleware/validateRequest';
import { UserRole } from '../auth/auth.interface';
import { PermissionsController } from './permissions.controller';
import { permissionsValidation } from './permissions.validation';

const router = Router();

/**
 * The catalogue of permission modules — the list every role is built from.
 *
 * All four of these were open: no `auth()`, no permission, nothing. Anyone who
 * could reach the API could read the catalogue, add to it, rename an entry, or
 * delete one outright — and deleting the row a role's grants are written
 * against is how an institute loses access to its own screens with no error
 * message to explain it.
 *
 * Gated in two tiers, because reading and editing are not the same act:
 *
 * - **Reading** needs `Roles/view`. The permission matrix on the role screen is
 *   the only thing that asks for this list, and anyone editing a role already
 *   holds that.
 *
 * - **Writing** is left to the super admin. These rows are not institute data —
 *   they are the vocabulary the application's own gates are written in, seeded
 *   by the modules themselves at boot. An admin who needs a new one needs a
 *   developer, not a form.
 */
router.get(
  '/',
  auth(),
  checkPermission('Roles', 'view'),
  PermissionsController.getAllPermissions
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(permissionsValidation.create),
  PermissionsController.createPermission
);

router.put(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  validateRequest(permissionsValidation.update),
  PermissionsController.updatePermission
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  PermissionsController.deletePermission
);

export const PermissionsRoutes = router;
