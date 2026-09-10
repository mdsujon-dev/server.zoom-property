import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../utils/catchAsync";
import publicQuery from "../../utils/publicQuery";
import sendResponse from "../../utils/sendResponse";
import { LandownerProjectService } from "./landownerProject.service";

const userId = (req: Request) => (req as any).user?.userId;

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await LandownerProjectService.createProject(
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Block created successfully",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await LandownerProjectService.getAllProjects(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blocks retrieved successfully",
    meta,
    data,
  });
});

/**
 * The website's read. `publishedOnly` is forced rather than trusted from the
 * query: this route has no auth in front of it.
 */
const getPublicProjects = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await LandownerProjectService.getAllProjects({
    ...publicQuery(req.query as Record<string, unknown>, ["isHome"]),
    publishedOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blocks retrieved successfully",
    meta,
    data,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const result = await LandownerProjectService.getProjectById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Block retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const result = await LandownerProjectService.updateProject(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Block updated successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const result = await LandownerProjectService.deleteProject(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Block deleted successfully",
    data: result,
  });
});

export const LandownerProjectController = {
  createProject,
  getAllProjects,
  getPublicProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

export default LandownerProjectController;
