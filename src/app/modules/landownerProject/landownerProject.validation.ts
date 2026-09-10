import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const fields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  location: z.string().optional(),
  locationBn: z.string().optional(),

  landSizeKatha: z.number().min(0).optional().nullable(),
  floors: z.number().min(0).optional().nullable(),
  ownerSharePercent: z.number().min(0).max(100).optional().nullable(),
  completedYear: z.number().min(1900).optional().nullable(),

  image: objectId.optional().nullable(),

  isPublished: z.boolean().optional(),
  isHome: z.boolean().optional(),
  order: z.number().optional(),
};

export const landownerProjectValidation = {
  create: z.object({ body: z.object(fields) }),
  // Partial on update so the publish toggle can send one field on its own.
  update: z.object({ body: z.object(fields).partial() }),
};

export default landownerProjectValidation;
