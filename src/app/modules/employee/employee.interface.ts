import { Types } from "mongoose";

export interface ICreateEmployee {
  name: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  profilePhoto?: string;
  roleId: Types.ObjectId | string;
  designationId?: Types.ObjectId | string;
}

export interface IUpdateEmployee {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  profilePhoto?: string;
  roleId?: Types.ObjectId | string;
  designationId?: Types.ObjectId | string;
  isActive?: boolean;

  /**
   * The structured address, and the two things that belong to the account
   * rather than to the HR file.
   *
   * They live on `User` — see the address note there — so they are updated
   * through this call and not through the profile one. Written loosely because
   * the fourteen address fields are one thing, and listing each twice (here and
   * in the schema that validates them) is how the two drift apart.
   */
  [key: string]: unknown;
}
