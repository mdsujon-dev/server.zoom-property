import { z } from "zod";

import { optionalUrl as optionalUrlSchema } from "../../utils/optionalUrl";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// The shared validator: it accepts a bare address, pulls `src` out of a pasted
// embed, and treats an empty box as "not set" rather than as a bad URL.
const optionalUrl = optionalUrlSchema;

const reviewFields = {
  clientName: z.string().min(1, "Client name is required"),
  clientNameBn: z.string().optional(),
  role: z.string().optional(),
  roleBn: z.string().optional(),

  quote: z.string().min(1, "The quote is the review"),
  quoteBn: z.string().optional(),
  rating: z.number().min(1).max(5),

  photo: objectId.optional().nullable(),

  property: objectId.optional().nullable(),
  propertyLabel: z.string().optional(),

  video: z
    .object({
      youtubeUrl: optionalUrl,
      poster: objectId.optional().nullable(),
      duration: z.string().optional(),
    })
    .optional(),

  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  isHome: z.boolean().optional(),
  order: z.number().optional(),
};

export const reviewValidation = {
  create: z.object({ body: z.object(reviewFields) }),
  update: z.object({ body: z.object(reviewFields).partial() }),
};
