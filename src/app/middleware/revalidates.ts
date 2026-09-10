import { NextFunction, Request, Response } from "express";

import {
  revalidateFrontend,
  type RevalidateTag,
} from "../utils/revalidateFrontend";

/**
 * Refreshes the website's cache after a successful write to this module.
 *
 * Mounted once on a router rather than called from each controller, for two
 * reasons: a controller that forgets the call is a listing that silently never
 * appears, and the next mutation somebody adds is covered without them having
 * to know this exists.
 *
 * It fires on `finish` — after the response has gone to the panel — so a slow
 * or unreachable website cannot delay the save. That assumes a long-running
 * server, which this is. On a serverless host the process could be frozen
 * before the ping leaves, and the call would have to move inside the
 * controller, awaited, before `sendResponse`.
 *
 * Only successful mutations count. A rejected validation changed nothing, and
 * asking the site to rebuild over it would be pure noise.
 */
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const revalidates =
  (tag: RevalidateTag) => (req: Request, res: Response, next: NextFunction) => {
    if (!MUTATING.has(req.method)) return next();

    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        void revalidateFrontend(tag);
      }
    });

    next();
  };

export default revalidates;
