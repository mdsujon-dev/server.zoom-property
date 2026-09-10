import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { BlogController } from "./blog.controller";
import { blogValidation } from "./blog.validation";
import { revalidates } from "../../middleware/revalidates";

const router = Router();

// A successful write here means the website is showing something out of
// date. See `middleware/revalidates`.
router.use(revalidates("insights"));

// The website's read. Mounted first so "public" is never taken for an id.
router.get("/public", BlogController.getPublicPosts);
router.get("/public/:slug", BlogController.getPostBySlug);

/* ── Categories ─────────────────────────────────────────────────────────
   Before "/:id" so "categories" is never read as an article id. */
router.get("/categories", auth(), BlogController.listCategories);
router.post(
  "/categories",
  auth(),
  checkPermission("Blog", "create"),
  validateRequest(blogValidation.createCategory),
  BlogController.createCategory
);
router.patch(
  "/categories/:id",
  auth(),
  checkPermission("Blog", "update"),
  validateRequest(blogValidation.updateCategory),
  BlogController.updateCategory
);
router.delete(
  "/categories/:id",
  auth(),
  checkPermission("Blog", "delete"),
  BlogController.deleteCategory
);

/* ── Articles ───────────────────────────────────────────────────────────── */
router.get("/", auth(), BlogController.getAllPosts);
router.get("/:id", auth(), BlogController.getPostById);

router.post(
  "/",
  auth(),
  checkPermission("Blog", "create"),
  validateRequest(blogValidation.create),
  BlogController.createPost
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Blog", "update"),
  validateRequest(blogValidation.update),
  BlogController.updatePost
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Blog", "delete"),
  BlogController.deletePost
);

export const BlogRoutes = router;
