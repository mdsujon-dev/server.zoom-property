import { Schema, model } from "mongoose";

import { ILandownerBlock } from "./landownerProject.interface";

const landownerBlockSchema = new Schema<ILandownerBlock>(
  {
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true },

    // HTML from the editor. Not trimmed: leading markup is meaningful.
    description: { type: String },
    descriptionBn: { type: String },

    image: { type: Schema.Types.ObjectId, ref: "Media" },

    isPublished: { type: Boolean, default: false, index: true },
    isHome: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// The page reads in the desk's order, newest first within it.
landownerBlockSchema.index({ order: 1, createdAt: -1 });

export const LandownerProject = model<ILandownerBlock>(
  "LandownerProject",
  landownerBlockSchema
);

export default LandownerProject;
