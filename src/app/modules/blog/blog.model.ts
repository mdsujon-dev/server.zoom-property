import { Schema, model } from "mongoose";
import { IBlogCategory, IBlogPost } from "./blog.interface";

const categorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BlogCategory = model<IBlogCategory>("BlogCategory", categorySchema);

const authorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    role: { type: String, trim: true },
    roleBn: { type: String, trim: true },
    avatar: { type: Schema.Types.ObjectId, ref: "Media" },
    // The writer's own photograph, copied at the moment of writing.
    avatarUrl: { type: String, trim: true },
  },
  { _id: false }
);

const postSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },

    excerpt: { type: String, trim: true },
    excerptBn: { type: String, trim: true },

    content: { type: String },
    contentBn: { type: String },

    category: {
      type: Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
      index: true,
    },
    tags: { type: [String], default: [] },

    coverImage: { type: Schema.Types.ObjectId, ref: "Media" },
    thumbnail: { type: Schema.Types.ObjectId, ref: "Media" },
    // Not required: the API derives it from the signed-in writer.
    author: { type: authorSchema },

    metaTitle: { type: String, trim: true },
    metaTitleBn: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaDescriptionBn: { type: String, trim: true },

    readMinutes: { type: Number, default: 1, min: 1 },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },

    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false },
    views: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

postSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// The blog index: published posts, newest first.
postSchema.index({ status: 1, publishedAt: -1 });

export const BlogPost = model<IBlogPost>("BlogPost", postSchema);
