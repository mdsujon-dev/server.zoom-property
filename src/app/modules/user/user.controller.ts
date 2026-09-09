import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { storeUpload } from "../../utils/storeUpload";
import { IJwtPayload } from "../auth/auth.interface";
// Pay is one job for both kinds of staff, so it is one service.
import { SalaryService } from "../employee/salary.service";
import { UserServices } from "./user.service";

const assertNotSelf = (req: Request, action: string) => {
  const actor = req.user as IJwtPayload | undefined;
  if (actor?.userId && String(actor.userId) === String(req.params.id)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `You cannot ${action} your own account`
    );
  }
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
 await UserServices.registerUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User registration completed successfully!",
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUser(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users are retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

/**
 * A staff member's pay — the ledger, a payment, and a payment handed back.
 *
 * All three write to the same transaction ledger the rest of the money does,
 * so payroll shows up in the cash book without a second place to look.
 */
const getSalaryLedger = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Salary ledger retrieved",
    data: await SalaryService.getSalaryLedger(req.params.id),
  });
});

const paySalary = catchAsync(async (req: Request, res: Response) => {
  const result = await SalaryService.paySalary(
    req.params.id,
    req.body,
    req.user?.userId
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Salary paid",
    data: result,
  });
});

const returnSalary = catchAsync(async (req: Request, res: Response) => {
  const result = await SalaryService.returnSalary(
    req.params.id,
    req.body,
    req.user?.userId
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Salary returned",
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employee retrieved successfully",
    data: await UserServices.getUserById(req.params.id),
  });
});

const myProfile = catchAsync(async (req, res) => {
  const result = await UserServices.myProfile(req.user as IJwtPayload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});



const updateUserStatus = catchAsync(async (req, res) => {
  assertNotSelf(req, "change the active status of");
  const userId = req.params.id;
  const result = await UserServices.updateUserStatus(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User is now ${result.isActive ? "active" : "inactive"}`,
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const result = await UserServices.updateUser(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  assertNotSelf(req, "delete");
  const userId = req.params.id;
  await UserServices.deleteUser(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  assertNotSelf(req, "change the password of");
  const userId = req.params.id;
  const { newPassword } = req.body;
  const result = await UserServices.changePassword(userId, newPassword);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }
  /* The uploader's id and the moment, which is the whole naming scheme: it
     makes the key unique without a lookup, says who owns the file, and lets a
     new upload replace an old one in the interface without either overwriting
     the other in storage. */
  const jwt = req.user as IJwtPayload & { _id?: string; id?: string };
  const owner = jwt?.userId ?? jwt?._id ?? jwt?.id ?? "anonymous";

  const url = await storeUpload(req.file, {
    folder: "profile-image",
    basename: `${owner}-${Date.now()}`,
    origin: `${req.protocol}://${req.get("host")}`,
  });
  const updated = await UserServices.uploadProfileImage(
    req.user as IJwtPayload,
    url
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile image uploaded successfully",
    data: { url, user: updated },
  });
});

const getAllProfileImages = catchAsync(async (req, res) => {
  const data = await UserServices.getAllProfileImages(req.user as IJwtPayload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile images retrieved successfully",
    data,
  });
});

export const UserController = {
  getUserById,
  getSalaryLedger,
  paySalary,
  returnSalary,
  registerUser,
  getAllUser,
  myProfile,
  updateUserStatus,
  updateUser,
  deleteUser,
  changePassword,
  uploadProfileImage,
  getAllProfileImages,
};
