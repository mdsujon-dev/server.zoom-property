import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProjectService } from "./project.service";

const userId = (req: Request) => (req as any).user?.userId;

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Project created successfully",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ProjectService.getAllProjects(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Projects retrieved successfully",
    meta,
    data,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getProjectById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.updateProject(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.deleteProject(req.params.id, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project deleted successfully",
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
