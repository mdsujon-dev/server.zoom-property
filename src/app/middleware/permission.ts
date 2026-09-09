import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  isPersonaRole,
  predefinedAccessAllows,
} from "../access";
import AppError from "../errors/appError";
import { RolePermission } from "../modules/rolePermission/rolePermission.model";
import { UserRole } from "../modules/auth/auth.interface";
import User from "../modules/auth/auth.model";
import catchAsync from "../utils/catchAsync";

export interface PermissionRequirement {
  module: string;
  action: string;
}

/**
 * Resolves the calling user and returns:
 *   - the user document (for `isActive` / `roleId` access)
 *   - whether they're a SUPER_ADMIN (bypass)
 */
const resolveActingUser = async (req: Request) => {
  const user = (req as any).user;
  if (!user || !user.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
  }

  const userData = await User.findById(user.userId);
  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }
  if (!userData.isActive) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is not active!");
  }

  const isSuperAdmin =
    String(userData.role ?? "").toUpperCase() ===
    String(UserRole.SUPER_ADMIN).toUpperCase();

  return { userData, isSuperAdmin };
};

/**
 * True if the user has the given action on the given module (case-insensitive).
 *
 * Two sources, never both: a trainer's and a student's access is fixed in
 * `src/app/access` and is not editable, so for those roles the `RolePermission`
 * collection is not consulted at all — a stray row left behind by an earlier
 * version of the panel cannot widen what they may do.
 */
const hasPermission = async (
  user: { role?: string; roleId?: unknown },
  module: string,
  action: string
): Promise<boolean> => {
  if (isPersonaRole(user.role)) {
    return predefinedAccessAllows(user.role, module, action);
  }
  if (!user.roleId) return false;
  const rp = await RolePermission.findOne({ roleId: user.roleId, module });
  if (!rp) return false;
  const wanted = String(action).toUpperCase();
  return (rp.permissions || []).some(
    (p) => String(p).toUpperCase() === wanted
  );
};

/**
 * Require a single `module + action` permission on the caller's role.
 * SUPER_ADMIN bypasses every check.
 */
const checkPermission = (module: string, action: string) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const { userData, isSuperAdmin } = await resolveActingUser(req);
      if (isSuperAdmin) return next();

      const ok = await hasPermission(userData, module, action);
      if (!ok) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this resource!"
        );
      }
      next();
    }
  );
};

/**
 * The same question `checkPermission` gates on, answered as a value.
 *
 * For the routes where lacking a permission narrows what you may do rather
 * than refusing you outright: anyone with `Certificates/create` may issue a
 * certificate, but issuing one to a student who did not earn it additionally
 * needs `Certificates/override` — and the service has to know which of the two
 * it is dealing with, not merely be allowed through the door.
 */
export const userCan = async (
  req: Request,
  module: string,
  action: string
): Promise<boolean> => {
  const { userData, isSuperAdmin } = await resolveActingUser(req);
  if (isSuperAdmin) return true;
  return hasPermission(userData, module, action);
};

/**
 * Require ANY of the supplied `{module, action}` requirements — useful when a
 * route serves multiple regions / variants (e.g. BD Services or Egypt Services).
 * SUPER_ADMIN bypasses.
 */
export const checkPermissionAny = (requirements: PermissionRequirement[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const { userData, isSuperAdmin } = await resolveActingUser(req);
      if (isSuperAdmin) return next();

      for (const r of requirements) {
        if (await hasPermission(userData, r.module, r.action)) {
          return next();
        }
      }
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to access this resource!"
      );
    }
  );
};

export default checkPermission;
