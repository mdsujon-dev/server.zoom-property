import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AreaService } from "./area.service";

const userId = (req: Request) => (req as any).user?.userId;

const createArea = catchAsync(async (req: Request, res: Response) => {
  const result = await AreaService.createArea(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Area created successfully",
    data: result,
  });
});

const getAllAreas = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await AreaService.getAllAreas(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Areas retrieved successfully",
    meta,
    data,
  });
});

const getAreaById = catchAsync(async (req: Request, res: Response) => {
  const result = await AreaService.getAreaById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Area retrieved successfully",
    data: result,
  });
});

const updateArea = catchAsync(async (req: Request, res: Response) => {
  const result = await AreaService.updateArea(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Area updated successfully",
    data: result,
  });
});

const deleteArea = catchAsync(async (req: Request, res: Response) => {
  const result = await AreaService.deleteArea(req.params.id, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Area deleted successfully",
    data: result,
  });
});

export const AreaController = {
  createArea,
  getAllAreas,
  getAreaById,
  updateArea,
  deleteArea,
};
