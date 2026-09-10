import { Schema, model } from "mongoose";

import { ILandownerProject } from "./landownerProject.interface";

const landownerProjectSchema = new Schema<ILandownerProject>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    location: { type: String, trim: true },
    locationBn: { type: String, trim: true },

    landSizeKatha: { type: Number, min: 0 },
    floors: { type: Number, min: 0 },
    // A share outside 0-100 is a typo, not a deal.
    ownerSharePercent: { type: Number, min: 0, max: 100 },
    completedYear: { type: Number, min: 1900 },

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

// The page reads in the desk's order, newest handover first within it.
landownerProjectSchema.index({ order: 1, completedYear: -1 });

export const LandownerProject = model<ILandownerProject>(
  "LandownerProject",
  landownerProjectSchema
);

export default LandownerProject;
