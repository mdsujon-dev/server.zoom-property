import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DashboardServices } from "./dashboard.service";
import { CompanyDashboardService } from "./company.service";

const getOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getOverview();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard overview fetched successfully",
    data: result,
  });
});

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

const getTrafficSources = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildTrafficSources();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Traffic sources fetched successfully",
    data: result,
  });
});

const getWeeklyActivity = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildWeeklyActivity();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Weekly activity fetched successfully",
    data: result,
  });
});

const getQuickStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildQuickStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Quick stats fetched successfully",
    data: result,
  });
});

/** The agency's own numbers, not the website's visitors. */
const getCompanyOverview = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard loaded",
    data: await CompanyDashboardService.getCompanyOverview(req),
  });
});

export const DashboardControllers = {
  getCompanyOverview,
  getOverview,
  getStats,
  getTrafficSources,
  getWeeklyActivity,
  getQuickStats,
};
