import { Schema, model, Document, Types } from "mongoose";

export type EmployeeStatus = "active" | "inactive" | "resigned";
export type StaffEmploymentType = "full-time" | "part-time" | "contract";
/**
 * How the agreed pay is reckoned.
 *
 * Not the trainer's list: a trainer is paid per class or per hour because their
 * work arrives in classes and hours. Office staff are on a wage — a month, a
 * day, or a year — and offering "per-class" for a receptionist is offering an
 * answer that cannot be right.
 */
export type StaffSalaryType = "monthly" | "daily" | "yearly";

/**
 * The HR side of a staff member.
 *
 * Authentication (email, password, role) lives on `User` and only there. This
 * document holds the things a login has no business storing — joining date,
 * salary, emergency contact, papers — and is addressed by the account it
 * belongs to, so `user` is both required and unique.
 */
export interface IEmployeeProfile extends Document {
  employeeId: string; // auto-generated: EMP-2026-001
  user: Types.ObjectId;
  designation?: Types.ObjectId;

  dateOfBirth?: Date;
  gender?: "Male" | "Female" | "Other";
  bloodGroup?: string;
  /** Kept because the forms an agency files ask for them, and asking the
      person again a year later is worse than storing them once. */
  fatherName?: string;
  motherName?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";

  employmentType: StaffEmploymentType;
  joiningDate: Date;
  resignDate?: Date;
  salary?: number;
  salaryType: StaffSalaryType;

  presentAddress?: string;
  permanentAddress?: string;
  nidNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  documents?: Types.ObjectId[];

  status: EmployeeStatus;
  note?: string;

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    employeeId: { type: String, required: true, trim: true, uppercase: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    designation: { type: Schema.Types.ObjectId, ref: "Designation" },

    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodGroup: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract"],
      default: "full-time",
    },
    joiningDate: { type: Date, default: Date.now },
    resignDate: { type: Date },
    salary: { type: Number, min: 0 },
    // Monthly by default: it is what almost every office post is on, and a
    // figure with no unit beside it is read as a month anyway.
    salaryType: {
      type: String,
      enum: ["monthly", "daily", "yearly"],
      default: "monthly",
    },

    presentAddress: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },
    nidNumber: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    documents: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    status: {
      type: String,
      enum: ["active", "inactive", "resigned"],
      default: "active",
      index: true,
    },
    note: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

employeeProfileSchema.index(
  { employeeId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
// Exactly one profile per account.
employeeProfileSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const EmployeeProfile = model<IEmployeeProfile>(
  "EmployeeProfile",
  employeeProfileSchema
);
