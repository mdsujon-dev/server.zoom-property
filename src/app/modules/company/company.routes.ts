import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CompanyService } from "./company.service";

const router = Router();

const userId = (req: Request) => (req as any).user?.userId as string | undefined;

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Company settings",
    data: await CompanyService.getSettings(),
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Settings saved",
    data: await CompanyService.updateSettings(req.body, userId(req)),
  });
});

// Exported so tooling can read it — see `postman/generate.ts`.
export const settingsBody = z.object({
  body: z.object({
    name: z.string().min(1, "The company needs a name").optional(),
    shortName: z.string().optional(),
    tagline: z.string().optional(),
    logo: z.string().optional(),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    licenceNo: z.string().optional(),
    invoicePrefix: z.string().optional(),
    invoiceFooter: z.string().optional(),
    reportFooter: z.string().optional(),
    idCardNote: z.string().optional(),
    // The design keys are the panel's, not the server's — it renders the cards,
    // so it owns the list. Validated as a plain string so adding a design does
    // not need a server release.
    idCardTemplates: z
      .object({
        agent: z.string().optional(),
        employee: z.string().optional(),
      })
      .optional(),
    // Shape owned by the panel — see the model comment.
    idCardOptions: z.record(z.any()).optional(),
  }),
});

/**
 * Readable by anyone signed in — an ID card, a receipt and a report letterhead
 * all need the company's name and logo, and gating that would mean an agent
 * printing a card with the name missing. Writing it is a separate right.
 */
router.get("/", auth(), getSettings);

router.patch(
  "/",
  auth(),
  checkPermission("Company Settings", "update"),
  validateRequest(settingsBody),
  updateSettings
);

export const CompanyRoutes = router;
