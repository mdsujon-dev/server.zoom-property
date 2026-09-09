import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReportRange, ReportService } from "./report.service";

const range = (req: Request): ReportRange => ({
  startDate: req.query.startDate as string | undefined,
  endDate: req.query.endDate as string | undefined,
  page: req.query.page ? Number(req.query.page) : undefined,
  limit: req.query.limit ? Number(req.query.limit) : undefined,
});

const send = (res: Response, message: string, data: any) =>
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message,
    meta: data?.meta,
    data,
  });

const financial = catchAsync(async (req: Request, res: Response) =>
  send(res, "Financial report", await ReportService.financialReport(range(req)))
);

const cashBook = catchAsync(async (req: Request, res: Response) =>
  send(res, "Cash book", await ReportService.cashBookReport(range(req)))
);

const profitLoss = catchAsync(async (req: Request, res: Response) =>
  send(res, "Profit and loss", await ReportService.profitLossReport(range(req)))
);

export const ReportController = {
  financial,
  cashBook,
  profitLoss,
};
