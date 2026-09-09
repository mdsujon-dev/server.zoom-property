import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const areaFields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  city: z.string().optional(),

  tagline: z.string().optional(),
  taglineBn: z.string().optional(),

  medianPrice: z.number().min(0).optional().nullable(),
  pricePerSqft: z.number().min(0).optional().nullable(),
  rentalYield: z.string().optional(),

  image: objectId.optional().nullable(),

  note: z.string().optional(),
  noteBn: z.string().optional(),
  securityTier: z.string().optional(),
  metroConnectivity: z.string().optional(),

  order: z.number().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const areaValidation = {
  create: z.object({ body: z.object(areaFields) }),
  update: z.object({ body: z.object(areaFields).partial() }),
};
