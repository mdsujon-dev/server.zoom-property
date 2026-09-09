import { Schema, model } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    clientName: { type: String, required: true, trim: true },
    clientNameBn: { type: String, trim: true },
    role: { type: String, trim: true },
    roleBn: { type: String, trim: true },

    quote: { type: String, required: true, trim: true },
    quoteBn: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },

    photo: { type: Schema.Types.ObjectId, ref: "Media" },

    property: { type: Schema.Types.ObjectId, ref: "Property", index: true },
    propertyLabel: { type: String, trim: true },

    video: {
      youtubeUrl: { type: String, trim: true },
      poster: { type: Schema.Types.ObjectId, ref: "Media" },
      duration: { type: String, trim: true },
    },

    // Unpublished by default: a review goes up because somebody decided it
    // should, not because it was typed in.
    isPublished: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Review = model<IReview>("Review", reviewSchema);
