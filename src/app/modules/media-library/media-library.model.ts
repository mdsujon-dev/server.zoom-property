import { Schema, model } from "mongoose";
import { r2PublicUrl } from "../../utils/r2";
import { IMedia } from "./media-library.interface";

const mediaSchema = new Schema<IMedia>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "application/octet-stream",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document", "other"],
      default: "other",
    },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    // The folder ↔ media relationship. `null` = media is not inside any folder.
    folder: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Virtuals must survive `.toJSON()` / `.toObject()`, otherwise a populated
    // photo would reach the client without its URL.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// The browser-facing URL, derived from the stored object key. Exposed as a
// virtual so every `populate("photo")` / `populate("documents")` returns
// { _id, key, url } without each service having to map it by hand.
mediaSchema.virtual("url").get(function (this: IMedia) {
  return this.key ? r2PublicUrl(this.key) : undefined;
});

// Fast "media in this folder" lookups.
mediaSchema.index({ folder: 1, createdAt: -1 });

export const Media = model<IMedia>("Media", mediaSchema);

export default Media;
