import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import config from "../../config";
import AppError from "../../errors/appError";
import { Designation } from "../designation/designation.model";
import { Role } from "../role/role.model";
import { UserSearchableFields } from "../auth/auth.model";
import { UserRole } from "../auth/auth.interface";
import User from "../auth/auth.model";
import { Counter } from "../../shared/counter.model";
import { ICreateEmployee, IUpdateEmployee } from "./employee.interface";
import { EmployeeProfile } from "./employee.model";

// EMP-2026-001, from the shared atomic counter every reference number uses.
const nextEmployeeId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counter = await Counter.findByIdAndUpdate(
    `employee-${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `EMP-${year}-${String(counter!.seq).padStart(3, "0")}`;
};

// Every staff read hands back the account and its HR profile together, so the
// admin never has to know they are two documents.
const withProfile = async (user: any) => {
  if (!user) return user;
  const profile = await EmployeeProfile.findOne({
    user: user._id,
    isDeleted: { $ne: true },
  }).populate({ path: "designation", select: "_id name" });
  return { ...user.toObject(), profile: profile ?? null };
};

const resolveRole = async (roleId: ICreateEmployee["roleId"]) => {
  const roleDoc = await Role.findById(roleId);
  if (!roleDoc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  if (!roleDoc.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Role is not active");
  }
  return roleDoc;
};

const resolveDesignation = async (
  designationId: ICreateEmployee["designationId"]
) => {
  if (!designationId) return null;
  const doc = await Designation.findById(designationId);
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Designation not found");
  }
  if (doc.is_active === false) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Designation is not active");
  }
  return doc;
};

// Excludes soft-deleted records. Email uniqueness still applies across the
// whole collection (soft-deleted included), to avoid resurrecting a "ghost"
// account by creating a new one with the same email.
const liveFilter = { isDeleted: { $ne: true } } as const;

const findLiveEmployee = async (id: string) => {
  const employee = await User.findOne({ _id: id, ...liveFilter });
  if (!employee) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  return employee;
};

const createEmployee = async (payload: ICreateEmployee) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const roleDoc = await resolveRole(payload.roleId);
  const designationDoc = await resolveDesignation(payload.designationId);

  const employee = await User.create({
    ...payload,
    role: roleDoc.role.toUpperCase() as UserRole,
    roleId: roleDoc._id,
    designationId: designationDoc?._id,
    loginInfo: {
      device: "system",
      browser: "system",
      ipAddress: "0.0.0.0",
    },
  });

  // The HR profile is created in the same breath. If it fails the account is
  // removed too, so a staff member is never half-created.
  try {
    await EmployeeProfile.create({
      employeeId: await nextEmployeeId(),
      user: employee._id,
      designation: designationDoc?._id,
      joiningDate: new Date(),
    });
  } catch (err) {
    await User.findByIdAndDelete(employee._id);
    throw err;
  }

  return withProfile(employee);
};

const getAllEmployees = async (query: Record<string, unknown>) => {
  const employeeQuery = new QueryBuilder(
    User.find({
      roleId: { $exists: true, $ne: null },
      // Leads live on the LEAD role — keep them out of the employee list.
      role: { $ne: "LEAD" },
      ...liveFilter,
    })
      .populate({ path: "roleId", select: "_id role" })
      .populate({ path: "designationId", select: "_id name" }),
    query,
  )
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await employeeQuery.modelQuery;
  const meta = await employeeQuery.countTotal();
  return { result, meta };
};

const getEmployeeById = async (id: string) => {
  const employee = await User.findOne({ _id: id, ...liveFilter })
    .populate({ path: "roleId", select: "_id role" })
    .populate({ path: "designationId", select: "_id name" });
  if (!employee) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  return withProfile(employee);
};

// Update the HR side. Addressed by the account id, same as every other
// employee route, so the admin only ever deals with one identifier.
const updateEmployeeProfile = async (
  userId: string,
  payload: Record<string, unknown>
) => {
  await findLiveEmployee(userId);
  const profile = await EmployeeProfile.findOneAndUpdate(
    { user: userId, isDeleted: { $ne: true } },
    { ...payload, user: userId },
    { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
  ).populate({ path: "designation", select: "_id name" });

  // A profile created by upsert still needs its readable id.
  if (profile && !profile.employeeId) {
    profile.employeeId = await nextEmployeeId();
    await profile.save();
  }
  return profile;
};

const updateEmployee = async (id: string, payload: IUpdateEmployee) => {
  const employee = await findLiveEmployee(id);

  if (payload.email && payload.email !== employee.email) {
    const taken = await User.findOne({ email: payload.email });
    if (taken) {
      throw new AppError(StatusCodes.CONFLICT, "Email is already registered");
    }
  }

  const updatePayload: Record<string, unknown> = { ...payload };

  if (payload.roleId) {
    const roleDoc = await resolveRole(payload.roleId);
    updatePayload.roleId = roleDoc._id;
    updatePayload.role = roleDoc.role.toUpperCase();
  }

  if (payload.designationId) {
    const designationDoc = await resolveDesignation(payload.designationId);
    updatePayload.designationId = designationDoc?._id;
    await EmployeeProfile.updateOne(
      { user: id, isDeleted: { $ne: true } },
      { designation: designationDoc?._id }
    );
  }

  const updated = await User.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "roleId", select: "_id role" })
    .populate({ path: "designationId", select: "_id name" });

  return updated;
};

const toggleEmployeeStatus = async (id: string) => {
  const employee = await findLiveEmployee(id);
  employee.isActive = !employee.isActive;
  const updated = await employee.save();
  return updated;
};

// Soft delete — flips `isDeleted` so the record disappears from admin lists
// but the row stays in MongoDB (recoverable, keeps related history intact).
const deleteEmployee = async (id: string) => {
  const updated = await User.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isActive: false },
    { new: true }
  );
  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  await EmployeeProfile.updateOne(
    { user: id },
    { isDeleted: true, status: "resigned" }
  );
  return { message: "Employee deleted successfully" };
};

const changeEmployeePassword = async (id: string, newPassword: string) => {
  await findLiveEmployee(id);
  const hashed = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );
  await User.updateOne({ _id: id }, { password: hashed });
  return { message: "Password changed successfully" };
};

/**
 * Gives an HR profile to every staff account that predates this split, so
 * nothing created before it is left without one.
 */
const backfillProfiles = async () => {
  const missing = await User.find({
    roleId: { $exists: true, $ne: null },
    role: { $ne: "LEAD" },
    isDeleted: { $ne: true },
    _id: {
      $nin: await EmployeeProfile.find({ isDeleted: { $ne: true } }).distinct(
        "user"
      ),
    },
  }).select("_id designationId createdAt");

  for (const user of missing) {
    await EmployeeProfile.create({
      employeeId: await nextEmployeeId(),
      user: user._id,
      designation: user.designationId,
      joiningDate: user.createdAt ?? new Date(),
    });
  }
  return { created: missing.length };
};

export const EmployeeService = {
  createEmployee,
  updateEmployeeProfile,
  backfillProfiles,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  changeEmployeePassword,
};
