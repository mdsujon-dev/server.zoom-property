import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { PERSONA_ROLES, isPersonaRole } from "../../access";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { assertNotReferenced } from "../../utils/referenceGuard";
import User from "../auth/auth.model";
import { IRole } from "./role.interface";
import { Role } from "./role.model";

const RoleSearchableFields = ["role", "description"];

/**
 * FACULTY and STUDENT are personas, not roles somebody manages: their access is
 * fixed in `src/app/access` and editing the row would change nothing. Rather
 * than leave two rows in the list whose permission sheet has no effect, they are
 * hidden from reads and refused on writes.
 */
const assertNotPersonaRole = (role?: string | null) => {
  if (isPersonaRole(role)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `${role} is a system role — its access is predefined and cannot be edited`
    );
  }
};

const createRole = async (payload: Partial<IRole>) => {
  assertNotPersonaRole(payload.role);
  const existing = await Role.findOne({ role: payload.role });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "Role already exists");
  }
  const role = await Role.create(payload);
  return role;
};

const getAllRoles = async (query: Record<string, unknown>) => {
  const roleQuery = new QueryBuilder(
    Role.find({ role: { $nin: PERSONA_ROLES } }),
    query
  )
    .search(RoleSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const roles = await roleQuery.modelQuery;
  const meta = await roleQuery.countTotal();

  // Attach employeeCount per role — single aggregate covering just the page.
  const ids = roles.map((r: any) => r._id).filter(Boolean);
  let countMap = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await User.aggregate<{ _id: Types.ObjectId; count: number }>(
      [
        {
          $match: {
            roleId: { $in: ids },
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: "$roleId", count: { $sum: 1 } } },
      ]
    );
    countMap = new Map(grouped.map((g) => [String(g._id), g.count]));
  }

  const result = roles.map((r: any) => {
    const plain = typeof r.toObject === "function" ? r.toObject() : r;
    return { ...plain, employeeCount: countMap.get(String(plain._id)) ?? 0 };
  });

  return { result, meta };
};

const getRoleById = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

const updateRole = async (id: string, payload: Partial<IRole>) => {
  const existing = await Role.findById(id);
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  assertNotPersonaRole(existing.role);
  assertNotPersonaRole(payload.role);
  const role = await Role.findByIdAndUpdate(id, payload, { new: true });
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

const toggleRoleStatus = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  assertNotPersonaRole(role.role);
  role.isActive = !role.isActive;
  const updated = await role.save();
  return updated;
};

const deleteRole = async (id: string) => {
  const existing = await Role.findById(id);
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  assertNotPersonaRole(existing.role);

  /*
   * A real delete, and permissions are read by joining a user's `roleId` to
   * this collection. Remove the row and the join finds nothing, so every module
   * answers false: the account still signs in and then cannot open a single
   * page, with nothing on screen to explain it.
   *
   * The role's own permission rows are severable — they are the role, and go
   * with it — so they are the one referrer allowed to exist.
   */
  await assertNotReferenced("Role", id, {
    ignore: ["RolePermission.roleId"],
  });

  const role = await Role.findByIdAndDelete(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

export const RoleService = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  toggleRoleStatus,
  deleteRole,
};
