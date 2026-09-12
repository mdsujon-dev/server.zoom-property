import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AgentService } from "./agent.service";

const createAgent = catchAsync(async (req: Request, res: Response) => {
  const result = await AgentService.createAgent(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Agent created successfully",
    data: result,
  });
});

const getAllAgents = catchAsync(async (req: Request, res: Response) => {
  const result = await AgentService.getAllAgents(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agents retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAgent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AgentService.getSingleAgent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent retrieved successfully",
    data: result,
  });
});

const updateAgent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AgentService.updateAgent(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent updated successfully",
    data: result,
  });
});

const deleteAgent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AgentService.deleteAgent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent deleted successfully",
    data: result,
  });
});

export const AgentController = {
  createAgent,
  getAllAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};
