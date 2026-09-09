import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import config from "../../config";
import { IUser, UserModel } from "./auth.interface";

/**
 * The single account every person in the system signs in with.
 *
 * Deliberately narrow: identity, credentials, role and status — nothing else.
 * Who the person *is* beyond that (a student, a trainer, a staff member) lives
 * on their own profile document, which points back here.
 */
const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    // Never returned by a normal read — see the toJSON transform below.
    password: { type: String, required: true },

    // Role name is denormalised for fast auth checks; roleId is the real
    // relation the permission system reads.
    role: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    designationId: { type: Schema.Types.ObjectId, ref: "Designation" },

    // Their own weekly days off. Empty falls back to the company's week —
    // see the interface for why this is per person.
    weekendDays: {
      type: [String],
      enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
      default: [],
    },
    note: { type: String, trim: true },

    /**
     * The structured address, the same shape a student's is kept in.
     *
     * A single free-text line cannot be searched, sorted or printed onto a form
     * that asks for a district — and the agency's forms do. The old
     * `presentAddress` line stays for the records already written against it.
     */
    presentDivision: { type: String, trim: true },
    presentDistrict: { type: String, trim: true },
    presentCity: { type: String, trim: true },
    presentPoliceStation: { type: String, trim: true },
    presentPostOffice: { type: String, trim: true },
    presentPostalCode: { type: String, trim: true },
    presentDetailedAddress: { type: String, trim: true },

    permanentDivision: { type: String, trim: true },
    permanentDistrict: { type: String, trim: true },
    permanentCity: { type: String, trim: true },
    permanentPoliceStation: { type: String, trim: true },
    permanentPostOffice: { type: String, trim: true },
    permanentPostalCode: { type: String, trim: true },
    permanentDetailedAddress: { type: String, trim: true },

    salary: { type: Number, min: 0 },
    salaryType: {
      type: String,
      enum: ["monthly", "per-class", "per-hour"],
      default: "monthly",
    },

    profilePhoto: { type: String },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },

    lastLogin: { type: Date, default: Date.now },
    // Device/browser of the last sign-in, kept for the login history screen.
    loginInfo: {
      device: { type: String },
      browser: { type: String },
      ipAddress: { type: String },
      pcName: { type: String },
      os: { type: String },
      userAgent: { type: String },
    },

    // Flipped true when this user's role permissions change; the next
    // `/user/me` read returns it and resets it, forcing the panel to reload.
    hasPermissionChange: { type: Boolean, default: false },
    // Set when an account is issued with the shared default password.
    isPasswordChange: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Forgot-password flow. The code is hashed and never stored in plain text.
    resetCodeHash: { type: String, default: null, select: false },
    resetCodeExpiresAt: { type: Date, default: null, select: false },
    resetCodeAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Only (re)hash when the password actually changed — otherwise a plain
  // `.save()` (e.g. a status toggle) would double-hash and break login.
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string
) {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return User.findOne({ email }).select("+password");
};

userSchema.statics.checkUserExist = async function (userId: string) {
  return User.findById(userId);
};

// Model name stays "User" so every existing `ref: "User"` keeps resolving.
const User = model<IUser, UserModel>("User", userSchema);

export default User;

export const UserSearchableFields = ["email", "name", "role", "phone"];
