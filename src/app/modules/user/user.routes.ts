import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import loginInfoParser from "../../middleware/loginInfoParser";
import { authRateLimit } from "../../middleware/rateLimit";
import { profileImageUpload } from "../../middleware/upload";
import validateRequest from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

// List users — requires Employees / View permission
router.get(
  "/",
  auth(),
  checkPermission("Employees", "view"),
  UserController.getAllUser
);

// Logged-in user's own profile — any authenticated user.
// Before the parameterised route below, or "me" is read as an id.
router.get("/me", auth(), UserController.myProfile);

// Profile image: authenticated users upload their own to /uploads/profile-image/
// Auth must run BEFORE multer — multer's filename generator reads req.user.
router.post(
  "/profile-image",
  auth(),
  profileImageUpload.single("image"),
  UserController.uploadProfileImage
);

// List profile images — SUPER_ADMIN / ADMIN see everyone's, others see only theirs.
router.get("/profile-images", auth(), UserController.getAllProfileImages);

/* Pay is gated on Income & Expense, not on Employees: an office manager may
   edit a colleague's profile without being allowed to pay them. Mounted above
   "/:id" so the words are never read as an id. */
router.get(
  "/:id/salary",
  auth(),
  checkPermission("Income & Expense", "view"),
  UserController.getSalaryLedger
);

router.post(
  "/:id/salary",
  auth(),
  checkPermission("Income & Expense", "create"),
  validateRequest(UserValidation.salary),
  UserController.paySalary
);

router.post(
  "/:id/salary-return",
  auth(),
  checkPermission("Income & Expense", "create"),
  validateRequest(UserValidation.salary),
  UserController.returnSalary
);

// One employee, for their profile page. Last of the GETs so the fixed paths
// above are never swallowed by the parameter.
router.get(
  "/:id",
  auth(),
  checkPermission("Employees", "view"),
  UserController.getUserById
);

// Public registration — no auth
router.post(
  "/",
  authRateLimit,
  loginInfoParser,
  validateRequest(UserValidation.userValidationSchema),
  UserController.registerUser
);

// Toggle status — requires Employees / Update permission
router.patch(
  "/:id/status",
  auth(),
  checkPermission("Employees", "update"),
  UserController.updateUserStatus
);

// Update user — requires Employees / Update permission
router.patch(
  "/:id",
  auth(),
  checkPermission("Employees", "update"),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

// Delete user — requires Employees / Delete permission
router.delete(
  "/:id",
  auth(),
  checkPermission("Employees", "delete"),
  UserController.deleteUser
);

// Change password — requires Employees / Change Password permission
router.patch(
  "/:id/password",
  auth(),
  checkPermission("Employees", "change password"),
  validateRequest(UserValidation.changePasswordValidationSchema),
  UserController.changePassword
);

export const UserRoutes = router;
