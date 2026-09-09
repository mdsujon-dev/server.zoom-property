import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userCan } from "../../middleware/permission";
import AppError from "../../errors/appError";
import { getHistory } from "./history.service";

const GUARDS: Record<string, { module: string; action: string }> = {
  Property: { module: "Properties", action: "update" },
  Project: { module: "Projects", action: "update" },
  Agent: { module: "Agents", action: "update" },
  Area: { module: "Areas", action: "update" },
  BlogPost: { module: "Blog", action: "update" },
  Review: { module: "Reviews", action: "update" },
};

const getRecordHistory = catchAsync(async (req: Request, res: Response) => {
  const { entity, id } = req.params;
  const guard = GUARDS[entity];

  // An unknown entity is not a permission question — it is a typo, and
  // answering it with somebody's history would be worse than refusing.
  if (!guard) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Unknown record type");
  }
  if (!(await userCan(req, guard.module, guard.action))) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You do not have access to this record's history"
    );
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${entity} history`,
    data: await getHistory(entity, id),
  });
});

export const HistoryController = { getRecordHistory };
