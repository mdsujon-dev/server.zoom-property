import { Schema, model } from "mongoose";
import { IBlogComment } from "./blogComment.interface";

const blogCommentSchema = new Schema<IBlogComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const BlogComment = model<IBlogComment>("BlogComment", blogCommentSchema);
