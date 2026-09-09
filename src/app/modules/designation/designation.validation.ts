import { z } from "zod";
import { SELECTABLE_DESIGNATION_SCOPES } from "../../access";

/** The scopes an admin may create a designation under. */
const scope = z.enum(SELECTABLE_DESIGNATION_SCOPES as [string, ...string[]]);

export const designationValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
      scope: scope.optional(),
    }),
  }),
  update: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
      scope: scope.optional(),
    }),
  }),
};
