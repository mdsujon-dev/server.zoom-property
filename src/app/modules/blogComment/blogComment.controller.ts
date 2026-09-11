import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../utils/sendResponse";
import { blogCommentService } from "./blogComment.service";

const createBlogComment = catchAsync(async (req: Request, res: Response) => {
  const result = await blogCommentService.createBlogComment(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment submitted successfully and is pending approval",
    data: result,
  });
});

const getApprovedCommentsForPost = catchAsync(async (req: Request, res: Response) => {
  const result = await blogCommentService.getApprovedCommentsForPost(req.params.postId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const getAllBlogComments = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await blogCommentService.getAllBlogComments(paginationOptions);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All comments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateBlogCommentStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await blogCommentService.updateBlogCommentStatus(
    req.params.id,
    req.body.status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment status updated successfully",
    data: result,
  });
});

const deleteBlogComment = catchAsync(async (req: Request, res: Response) => {
  const result = await blogCommentService.deleteBlogComment(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const blogCommentController = {
  createBlogComment,
  getApprovedCommentsForPost,
  getAllBlogComments,
  updateBlogCommentStatus,
  deleteBlogComment,
};
