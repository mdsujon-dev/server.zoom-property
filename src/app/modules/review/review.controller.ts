import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import publicQuery from "../../utils/publicQuery";

const userId = (req: Request) => (req as any).user?.userId;

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Review saved successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ReviewService.getAllReviews(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta,
    data,
  });
});

/**
 * The website's read. `publishedOnly` is forced rather than trusted from the
 * query: this route has no auth in front of it, and a review goes up because
 * somebody decided it should, not because it was submitted.
 */
const getPublicReviews = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ReviewService.getAllReviews({
    ...publicQuery(req.query as Record<string, unknown>, [
      "featured",
      "rating",
      "isHome",
      "videoOnly",
    ]),
    publishedOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta,
    data,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.updateReview(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const togglePublished = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.togglePublished(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.isPublished ? "Review published" : "Review unpublished",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.deleteReview(req.params.id, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getPublicReviews,
  getReviewById,
  updateReview,
  togglePublished,
  deleteReview,
};
