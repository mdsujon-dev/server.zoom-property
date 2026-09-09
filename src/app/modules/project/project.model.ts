import { Schema, model } from "mongoose";
import { IProject, PROJECT_STAGES } from "./project.interface";

const milestoneSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    labelBn: { type: String, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    developer: { type: String, trim: true },

    area: { type: Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    city: { type: String, required: true, trim: true, default: "Dhaka" },

    progress: { type: Number, default: 0, min: 0, max: 100 },
    stage: {
      type: String,
      enum: [...PROJECT_STAGES],
      default: "Planning",
      index: true,
    },
    handover: { type: String, trim: true },

    units: { type: Number, default: 0, min: 0 },
    unitsLeft: { type: Number, default: 0, min: 0 },
    sizeRange: { type: String, trim: true },
    startingPrice: { type: Number, min: 0 },

    coverImage: { type: Schema.Types.ObjectId, ref: "Media" },
    images: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    description: { type: [String], default: [] },
    descriptionBn: { type: [String], default: [] },

    video: {
      title: { type: String, trim: true },
      titleBn: { type: String, trim: true },
      youtubeUrl: { type: String, trim: true },
      poster: { type: Schema.Types.ObjectId, ref: "Media" },
      duration: { type: String, trim: true },
    },

    lastInspected: { type: Date },
    cctvStreamActive: { type: Boolean, default: false },
    rajukPermitNo: { type: String, trim: true },

    milestones: { type: [milestoneSchema], default: [] },

    featured: { type: Boolean, default: false, index: true },
    isHome: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

projectSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Project = model<IProject>("Project", projectSchema);
