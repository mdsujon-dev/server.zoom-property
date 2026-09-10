import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../utils/catchAsync";
import publicQuery from "../../utils/publicQuery";
import sendResponse from "../../utils/sendResponse";
import { ShowcaseVideoService } from "./showcaseVideo.service";

const userId = (req: Request) => (req as any).user?.userId;

const createVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await ShowcaseVideoService.createVideo(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Video created successfully",
    data: result,
  });
});

const getAllVideos = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ShowcaseVideoService.getAllVideos(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Videos retrieved successfully",
    meta,
    data,
  });
});

/**
 * The website's read. `publishedOnly` is forced rather than trusted from the
 * query: this route has no auth in front of it, and an unpublished film is
 * nobody's business outside the panel.
 */
const getPublicVideos = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ShowcaseVideoService.getAllVideos({
    ...publicQuery(req.query as Record<string, unknown>, [
      "isHome",
      "category",
    ]),
    publishedOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Videos retrieved successfully",
    meta,
    data,
  });
});

const getVideoById = catchAsync(async (req: Request, res: Response) => {
  const result = await ShowcaseVideoService.getVideoById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Video retrieved successfully",
    data: result,
  });
});

const updateVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await ShowcaseVideoService.updateVideo(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Video updated successfully",
    data: result,
  });
});

const deleteVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await ShowcaseVideoService.deleteVideo(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Video deleted successfully",
    data: result,
  });
});

export const ShowcaseVideoController = {
  createVideo,
  getAllVideos,
  getPublicVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};

export default ShowcaseVideoController;
