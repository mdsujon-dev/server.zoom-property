import { z } from "zod";

const createBlogCommentSchema = z.object({
  body: z.object({
    post: z.string({ required_error: "Post ID is required" }),
    name: z.string({ required_error: "Name is required" }).min(1),
    email: z.string({ required_error: "Email is required" }).email(),
    content: z.string({ required_error: "Content is required" }).min(1),
  }),
});

const updateBlogCommentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
});

export const blogCommentValidation = {
  createBlogCommentSchema,
  updateBlogCommentStatusSchema,
};
