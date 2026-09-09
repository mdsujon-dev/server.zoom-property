import { z } from "zod";

/**
 * Bodies for the media routes that carry one.
 *
 * There was none of this: the controllers destructured `req.body` and trusted
 * what came out. `renameImage` read `{ oldName, newName }`, and sent neither it
 * called `rename(undefined, undefined)` on the storage client — a failure that
 * surfaced as a stack trace rather than as "you did not say what to rename".
 *
 * A storage key is a path with slashes in it, so it is only checked for being a
 * non-empty string; what makes a key valid is whether the object exists, and
 * that is the storage layer's question, not this one's.
 */
export const mediaValidation = {
  rename: z.object({
    body: z.object({
      oldName: z.string().min(1, "The current name is required"),
      newName: z.string().min(1, "The new name is required"),
    }),
  }),

  move: z.object({
    body: z.object({
      key: z.string().min(1, "The file key is required"),
      // The root folder is the empty string, so this is present-but-blank
      // rather than optional: moving to the root is a move, not a missing
      // destination.
      folder: z.string(),
    }),
  }),

  /* The bin's bulk actions: restore several, or purge several. */
  keys: z.object({
    body: z.object({
      keys: z
        .array(z.string().min(1))
        .min(1, "Choose at least one file"),
    }),
  }),
};

export default mediaValidation;
