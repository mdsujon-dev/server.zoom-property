import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { blogCommentController } from "./blogComment.controller";
import { blogCommentValidation } from "./blogComment.validation";

const router = Router();

// Public route to submit a comment
router.post(
  "/",
  validateRequest(blogCommentValidation.createBlogCommentSchema),
  blogCommentController.createBlogComment
);

// Public route to get approved comments for a specific post
router.get(
  "/post/:postId",
  blogCommentController.getApprovedCommentsForPost
);

// Admin routes
router.get(
  "/",
  auth(),
  checkPermission("Blog", "view"), // Using Blog permission for comments
  blogCommentController.getAllBlogComments
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Blog", "update"),
  validateRequest(blogCommentValidation.updateBlogCommentStatusSchema),
  blogCommentController.updateBlogCommentStatus
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Blog", "delete"),
  blogCommentController.deleteBlogComment
);

export const BlogCommentRoutes = router;
