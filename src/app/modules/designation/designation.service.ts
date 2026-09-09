import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import {
  DesignationScope,
  SELECTABLE_DESIGNATION_SCOPES,
} from "../../access";
import AppError from "../../errors/appError";
import { assertNotReferenced } from "../../utils/referenceGuard";
import User from "../auth/auth.model";
import { SUPER_ADMIN_DESIGNATION } from "./designation.constant";
import { IDesignation } from "./designation.interface";
import { Designation } from "./designation.model";
const createDesignation = async (designation: IDesignation) => {
  const newDesignation = await Designation.create(designation);
  return newDesignation;
};

/**
 * The one designation the app owns rather than the office: the super admin's.
 * It is hidden from the list, so reaching it means an id was typed by hand —
 * refuse rather than let a rename detach the seed from the accounts pointing
 * at it.
 */
const assertNotSystemDesignation = async (id: string) => {
  const existing = await Designation.findById(id).select("name scope");
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Designation not found");
  }
  if (existing.name === SUPER_ADMIN_DESIGNATION) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "This is a system designation and cannot be changed"
    );
  }
};

const updateDesignation = async (id: string, designation: IDesignation) => {
  await assertNotSystemDesignation(id);
  const updatedDesignation = await Designation.findByIdAndUpdate(id, designation, { new: true });
  return updatedDesignation;
};

const deleteDesignation = async (id: string) => {
  await assertNotSystemDesignation(id);

  /*
   * Also a real delete. Office staff and agents alike carry `designationId` on
   * the account — the guard finds every reference without being told, which is
   * the point of reading the relations off the schemas rather than listing them
   * here.
   */
  await assertNotReferenced("Designation", id);

  const deletedDesignation = await Designation.findByIdAndDelete(id);
  return deletedDesignation;
};

/**
 * The designations an admin may see, optionally narrowed to one scope.
 *
 * One row is never returned whatever is asked for: the internal "Super Admin"
 * designation, which the app owns rather than the office.
 */
const getAllDesignations = async (query: { scope?: string } = {}) => {
  const requested = String(query.scope ?? "").toLowerCase();
  const scope = SELECTABLE_DESIGNATION_SCOPES.includes(
    requested as DesignationScope
  )
    ? (requested as DesignationScope)
    : undefined;

  const allDesignations = await Designation.find({
    name: { $ne: SUPER_ADMIN_DESIGNATION },
    // Rows written before `scope` existed have no field at all, so an
    // employee-scoped read has to accept a missing value as "employee".
    ...(scope === "employee"
      ? { scope: { $in: ["employee", null] } }
      : scope
      ? { scope }
      : {}),
  }).sort({ createdAt: -1 });

  // Attach employeeCount per designation — one aggregate, then merge.
  const ids = allDesignations.map((d: any) => d._id).filter(Boolean);
  let countMap = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await User.aggregate<{ _id: Types.ObjectId; count: number }>(
      [
        {
          $match: {
            designationId: { $in: ids },
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: "$designationId", count: { $sum: 1 } } },
      ]
    );
    countMap = new Map(grouped.map((g) => [String(g._id), g.count]));
  }

  return allDesignations.map((d: any) => {
    const plain = typeof d.toObject === "function" ? d.toObject() : d;
    return { ...plain, employeeCount: countMap.get(String(plain._id)) ?? 0 };
  });
};

const toggleDesignationStatus = async (id: string) => {
  await assertNotSystemDesignation(id);
  const designation = await Designation.findById(id);
  if (!designation) {
    throw new AppError(StatusCodes.NOT_FOUND, "Designation not found");
  }
  designation.is_active = !designation.is_active;
  const updatedDesignation = await designation.save();
  return updatedDesignation;
};

export const designationService = {
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getAllDesignations,
  toggleDesignationStatus,
}
