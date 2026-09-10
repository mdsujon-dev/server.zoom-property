import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const fields = {
  title: z.string().min(1, "Title is required"),
  titleBn: z.string().optional(),

  // HTML from the editor, so no trim and no length ceiling that would cut a
  // passage off mid-tag.
  description: z.string().optional(),
  descriptionBn: z.string().optional(),

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
