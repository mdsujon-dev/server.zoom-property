import { z } from "zod";

import { optionalUrl } from "../../utils/optionalUrl";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/**
 * `youtubeUrl` is the one field that cannot be blank: a card with no film is a
 * still image nobody can play. It goes through the same tidier as every other
 * link on the panel, so a pasted embed is reduced to its src.
 */
const requiredUrl = optionalUrl.refine((v) => Boolean(v), {
  message: "A video link is required",
});

const videoFields = {
  title: z.string().min(1, "Title is required"),
  titleBn: z.string().optional(),
  description: z.string().optional(),
  descriptionBn: z.string().optional(),

  youtubeUrl: requiredUrl,
  poster: objectId.optional().nullable(),
  duration: z.string().optional(),

  category: z.string().optional(),
  categoryBn: z.string().optional(),

  location: z.string().optional(),
  locationBn: z.string().optional(),

  views: z.string().optional(),
  channelName: z.string().optional(),

  isPublished: z.boolean().optional(),
  isHome: z.boolean().optional(),
  order: z.number().optional(),
};

export const showcaseVideoValidation = {
  create: z.object({ body: z.object(videoFields) }),
  // Partial on update so the publish toggle can send one field on its own.
  update: z.object({ body: z.object(videoFields).partial() }),
};

export default showcaseVideoValidation;
