import { Schema, model } from "mongoose";
import { IOptionList, IProperty } from "./property.interface";

export const PURPOSES = ["sale", "rent"];

export const PROPERTY_TYPES = [
  "apartment",
  "duplex",
  "house",
  "commercial",
  "land",
];

export const PROPERTY_STATUSES = [
  "draft",
  "available",
  "reserved",
  "sold",
  "rented",
  "archived",
];

export const PROPERTY_BADGES = [
  "New",
  "Featured",
  "Exclusive",
  "Verified",
  "Price drop",
];

export const FURNISHINGS = [
  "Unfurnished",
  "Semi-furnished",
  "Fully furnished",
];

/* ── Managed option lists ───────────────────────────────────────────────
   Amenities are a name, an icon and an ordering. The factory exists because
   the next list the desk asks for will be the same three fields again. */
const optionListSchema = () =>
  new Schema<IOptionList>(
    {
      name: { type: String, required: true, trim: true, unique: true },
      nameBn: { type: String, trim: true },
      description: { type: String, trim: true },
      icon: { type: String, trim: true },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

export const PropertyAmenity = model<IOptionList>(
  "PropertyAmenity",
  optionListSchema()
);

/* ── Property ───────────────────────────────────────────────────────────── */
const propertySchema = new Schema<IProperty>(
  {
    referenceNo: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },

    purpose: { type: String, enum: PURPOSES, required: true, index: true },
    type: {
      type: String,
      enum: PROPERTY_TYPES,
      required: true,
      index: true,
    },
    // New listings start as drafts so a half-written record is never live.
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: "draft",
      index: true,
    },

    price: { type: Number, required: true, min: 0, index: true },
    previousPrice: { type: Number, min: 0 },
    serviceCharge: { type: Number, min: 0 },

    area: { type: Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    city: { type: String, required: true, trim: true, default: "Dhaka" },
    addressLine: { type: String, trim: true },

    beds: { type: Number, default: 0, min: 0 },
    baths: { type: Number, default: 0, min: 0 },
    size: { type: Number, required: true, min: 0 },
    katha: { type: Number, min: 0 },
    floor: { type: String, trim: true },
    parking: { type: Number, min: 0 },

    furnishing: {
      type: String,
      enum: FURNISHINGS,
      default: "Unfurnished",
    },
    handover: { type: String, trim: true },

    rajukApproved: { type: Boolean, default: false },
    hasVirtualTour: { type: Boolean, default: false },
    virtualTourUrl: { type: String, trim: true },
    videoUrl: { type: String, trim: true },

    coverImage: { type: Schema.Types.ObjectId, ref: "Media" },
    images: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    amenities: [{ type: Schema.Types.ObjectId, ref: "PropertyAmenity" }],

    description: { type: [String], default: [] },
    descriptionBn: { type: [String], default: [] },

    badge: { type: String, enum: PROPERTY_BADGES },
    featured: { type: Boolean, default: false, index: true },

    agent: { type: Schema.Types.ObjectId, ref: "Agent", index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", index: true },

    publishedAt: { type: Date },
    expiresAt: { type: Date, index: true },

    views: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A slug and a reference only have to be unique among listings that still
// exist, so a soft-deleted record frees its address up again.
propertySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
propertySchema.index(
  { referenceNo: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// The search box on the listings screen. `language_override` points at a field
// that does not exist on purpose: without it, a document with a `language`
// field would have its value read as the per-document search language, and
// Mongo rejects the insert for anything it does not recognise.
propertySchema.index(
  { title: "text", referenceNo: "text", addressLine: "text" },
  { language_override: "textSearchLanguage" }
);

// The public site's default query: available listings of a purpose, newest
// first. Named so it is obvious which screen regressed if it is ever dropped.
propertySchema.index({ status: 1, purpose: 1, createdAt: -1 });

export const Property = model<IProperty>("Property", propertySchema);
