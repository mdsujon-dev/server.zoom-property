import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PropertyService } from "./property.service";
import publicQuery from "../../utils/publicQuery";

const userId = (req: Request) => (req as any).user?.userId;

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.createProperty(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: `Listing created · ${result.referenceNo}`,
    data: result,
  });
});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PropertyService.getAllProperties(
    req.query as Record<string, unknown>,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listings retrieved successfully",
    meta,
    data,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getPropertyById(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listing retrieved successfully",
    data: result,
  });
});

/**
 * The website's list. `publishedOnly` is forced rather than trusted from the
 * query — this route has no auth in front of it, and a draft is nobody's
 * business outside the panel.
 */
const getPublicProperties = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PropertyService.getAllProperties({
    ...publicQuery(req.query as Record<string, unknown>, [
      "isHome",
      "featured",
      "area",
      "project",
      "type",
      "purpose",
      "badge",
      "city",
    ]),
    publishedOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Properties retrieved successfully",
    meta,
    data,
  });
});

const getPropertyBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getPropertyBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listing retrieved successfully",
    data: result,
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.updateProperty(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listing updated successfully",
    data: result,
  });
});

const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.changeStatus(
    req.params.id,
    req.body.status,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Listing marked ${result.status}`,
    data: result,
  });
});

const toggleFeatured = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.toggleFeatured(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.featured
      ? "Listing added to featured"
      : "Listing removed from featured",
    data: result,
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.deleteProperty(
    req.params.id,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listing deleted successfully",
    data: result,
  });
});

/* ── Managed option lists ───────────────────────────────────────────────── */

const listOptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.listOptions(
    req.params.kind,
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Options retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const createOption = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.createOption(req.params.kind, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Option created successfully",
    data: result,
  });
});

const updateOption = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.updateOption(
    req.params.kind,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Option updated successfully",
    data: result,
  });
});

const deleteOption = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.deleteOption(
    req.params.kind,
    req.params.id
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Option deleted successfully",
    data: result,
  });
});

export const PropertyController = {
  createProperty,
  getAllProperties,
  getPropertyById,
  getPublicProperties,
  getPropertyBySlug,
  updateProperty,
  changeStatus,
  toggleFeatured,
  deleteProperty,
  listOptions,
  createOption,
  updateOption,
  deleteOption,
};
