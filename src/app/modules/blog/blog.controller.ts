import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BlogService } from "./blog.service";

const userId = (req: Request) => (req as any).user?.userId;

const createPost = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.createPost(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Article created successfully",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await BlogService.getAllPosts(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Articles retrieved successfully",
    meta,
    data,
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getPostById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Article retrieved successfully",
    data: result,
  });
});

const getPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getPostBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Article retrieved successfully",
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.updatePost(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Article updated successfully",
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.deletePost(req.params.id, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Article deleted successfully",
    data: result,
  });
});

const listCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.listCategories(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.createCategory(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const BlogController = {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
