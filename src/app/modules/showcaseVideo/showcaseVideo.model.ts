import { Schema, model } from "mongoose";

import { IShowcaseVideo } from "./showcaseVideo.interface";

const showcaseVideoSchema = new Schema<IShowcaseVideo>(
  {
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true },
    description: { type: String, trim: true },
    descriptionBn: { type: String, trim: true },

    youtubeUrl: { type: String, required: true, trim: true },
    poster: { type: Schema.Types.ObjectId, ref: "Media" },
    duration: { type: String, trim: true },

    category: { type: String, trim: true },
    categoryBn: { type: String, trim: true },

    location: { type: String, trim: true },
    locationBn: { type: String, trim: true },

    views: { type: String, trim: true },
    channelName: { type: String, trim: true },

    isPublished: { type: Boolean, default: false, index: true },
    isHome: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// The carousel reads in the desk's order, newest first within it.
showcaseVideoSchema.index({ isHome: 1, order: 1, createdAt: -1 });

export const ShowcaseVideo = model<IShowcaseVideo>(
  "ShowcaseVideo",
  showcaseVideoSchema
);

export default ShowcaseVideo;
