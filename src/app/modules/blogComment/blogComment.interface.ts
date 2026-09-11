import { Types } from "mongoose";

export interface IBlogComment {
  post: Types.ObjectId;
  name: string;
  email: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}
