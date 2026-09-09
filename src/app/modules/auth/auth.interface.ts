import { Document, Model, Types } from "mongoose";

/** The days of the week, as stored. */
export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  ACCOUNTANT = "ACCOUNTANT",
  FRONT_DESK = "FRONT_DESK",
  USER = "USER",
}

/** Device details captured at sign-in, kept for the login-history screen. */
export interface ILoginInfo {
  device?: string;
  browser?: string;
  ipAddress?: string;
  pcName?: string;
  os?: string;
  userAgent?: string;
}

/**
 * The account every person signs in with.
 *
 * Deliberately narrow: identity, credentials, role and status. Who the person
 * *is* beyond that — agent, office staff — lives on their own profile
 * document, which points back here.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;

  role: UserRole;
  roleId?: Types.ObjectId;
  designationId?: Types.ObjectId;

  /**
   * The days of the week this member of staff is off.
   *
   * Per person rather than per office: staff do not all take the same day. An
   * agent works Saturday and is off Tuesday; the accountant is off Friday. A
   * single company-wide weekend marks every one of those exceptions absent for
   * a whole month before anybody notices.
   *
   * Empty means "the company's own week" — the shared default, so nobody has
   * to fill this in for the ordinary case.
   */
  weekendDays?: Weekday[];

  /** Anything the office needs to remember about them. */
  note?: string;

  profilePhoto?: string;

  /**
   * What the agency agreed to pay them, and how often.
   *
   * Recorded here rather than on the payment, so "what are they owed" has an
   * answer before anything has been paid. Every payment is still a ledger
   * entry, so the agency's expenses and one person's pay history are the
   * same set of rows read two ways — the same arrangement a trainer's pay uses.
   */
  /**
   * The structured address, the same shape a student's is kept in. The old
   * single-line `presentAddress` stays for records already written against it.
   */
  presentDivision?: string;
  presentDistrict?: string;
  presentCity?: string;
  presentPoliceStation?: string;
  presentPostOffice?: string;
  presentPostalCode?: string;
  presentDetailedAddress?: string;

  permanentDivision?: string;
  permanentDistrict?: string;
  permanentCity?: string;
  permanentPoliceStation?: string;
  permanentPostOffice?: string;
  permanentPostalCode?: string;
  permanentDetailedAddress?: string;

  salary?: number;
  salaryType?: "monthly" | "per-class" | "per-hour";

  isActive: boolean;
  isDeleted: boolean;

  lastLogin: Date;
  loginInfo?: ILoginInfo;

  /**
   * Flipped true when this user's role permissions change. The next
   * `/user/me` read returns it and resets it, so the panel reloads and picks
   * up the new access.
   */
  hasPermissionChange?: boolean;

  /**
   * True while the account is still on the password it was issued with.
   * Accounts created from a profile form (trainer, student) get a shared
   * default, so the panel blocks everything until it has been replaced.
   * Changing the password clears it.
   */
  isPasswordChange?: boolean;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  /** 6-digit reset code (hashed) for the forgot-password flow. */
  resetCodeHash?: string | null;
  resetCodeExpiresAt?: Date | null;
  resetCodeAttempts?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel extends Model<IUser> {
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isUserExistsByEmail(email: string): Promise<IUser>;
  checkUserExist(userId: string): Promise<IUser>;
}

/* ── Login payloads ─────────────────────────────────────────────────────── */
export interface IAuth {
  email: string;
  password: string;
  loginInfo?: ILoginInfo;
}

export interface IJwtPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date;
}
