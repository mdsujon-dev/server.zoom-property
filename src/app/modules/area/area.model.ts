import { Schema, model } from "mongoose";
import { IArea } from "./area.interface";

const areaSchema = new Schema<IArea>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true, default: "Dhaka" },

    tagline: { type: String, trim: true },
    taglineBn: { type: String, trim: true },

    medianPrice: { type: Number, min: 0 },
    pricePerSqft: { type: Number, min: 0 },
    rentalYield: { type: String, trim: true },

    image: { type: Schema.Types.ObjectId, ref: "Media" },

    note: { type: String, trim: true },
    noteBn: { type: String, trim: true },
    securityTier: { type: String, trim: true },
    metroConnectivity: { type: String, trim: true },

    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique among areas that still exist, so a merged area frees its address.
areaSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Area = model<IArea>("Area", areaSchema);
