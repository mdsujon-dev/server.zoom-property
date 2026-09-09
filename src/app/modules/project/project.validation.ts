import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const milestone = z.object({
  label: z.string().min(1, "Milestone name is required"),
  labelBn: z.string().optional(),
  percent: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val === "") return undefined;
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  })
  .refine(
    (val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid URL" }
  );

const projectFields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  developer: z.string().optional(),

  area: objectId,
  city: z.string().optional(),

  // `progress` is absent on purpose: it is the sum of the ticked milestones,
  // computed on save, and a form that could set it directly could make the
  // page lie.
  stage: z
    .enum(["Piling", "Structure", "Finishing", "Handover ready"])
    .optional(),
  handover: z.string().optional(),

  units: z.number().min(0).optional(),
  unitsLeft: z.number().min(0).optional(),
  sizeRange: z.string().optional(),
  startingPrice: z.number().min(0).optional().nullable(),

  coverImage: objectId.optional().nullable(),
  images: z.array(objectId).optional(),

  description: z.array(z.string()).optional(),
  descriptionBn: z.array(z.string()).optional(),

  video: z
    .object({
      title: z.string().optional(),
      titleBn: z.string().optional(),
      youtubeUrl: optionalUrl,
      poster: objectId.optional().nullable(),
      duration: z.string().optional(),
    })
    .optional(),

  lastInspected: z.coerce.date().optional().nullable(),
  cctvStreamActive: z.boolean().optional(),
  rajukPermitNo: z.string().optional(),

  milestones: z.array(milestone).optional(),

  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const projectValidation = {
  create: z.object({ body: z.object(projectFields) }),
  update: z.object({ body: z.object(projectFields).partial() }),
};
