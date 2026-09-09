import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const purpose = z.enum(["sale", "rent"]);
const propertyType = z.enum([
  "apartment",
  "duplex",
  "house",
  "commercial",
  "land",
]);
const status = z.enum([
  "draft",
  "available",
  "reserved",
  "sold",
  "rented",
  "archived",
]);
const badge = z.enum(["New", "Featured", "Exclusive", "Verified", "Price drop"]);
const furnishing = z.enum([
  "Unfurnished",
  "Semi-furnished",
  "Fully furnished",
]);

/**
 * The shape of a listing.
 *
 * `previousPrice`, `referenceNo`, `slug`, `publishedAt` and `views` are
 * deliberately absent: every one of them is the app's to set, and accepting
 * them here would let a form overwrite a reference number or advertise a price
 * cut that never happened.
 */
const listingFields = {
  title: z.string().min(1, "Title is required"),
  titleBn: z.string().optional(),

  purpose,
  type: propertyType,
  status: status.optional(),

  price: z.number().min(0, "Price cannot be negative"),
  serviceCharge: z.number().min(0).optional().nullable(),

  area: objectId,
  city: z.string().optional(),
  addressLine: z.string().optional(),

  beds: z.number().min(0).optional(),
  baths: z.number().min(0).optional(),
  size: z.number().min(0, "Size is required"),
  katha: z.number().min(0).optional().nullable(),
  floor: z.string().optional(),
  parking: z.number().min(0).optional().nullable(),

  furnishing: furnishing.optional(),
  handover: z.string().optional(),

  rajukApproved: z.boolean().optional(),
  hasVirtualTour: z.boolean().optional(),
  virtualTourUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),

  coverImage: objectId.optional().nullable(),
  images: z.array(objectId).optional(),
  amenities: z.array(objectId).optional(),

  description: z.array(z.string()).optional(),
  descriptionBn: z.array(z.string()).optional(),

  badge: badge.optional().nullable(),
  featured: z.boolean().optional(),

  agent: objectId.optional().nullable(),
  project: objectId.optional().nullable(),

  expiresAt: z.coerce.date().optional().nullable(),
};

const optionFields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
};

export const propertyValidation = {
  create: z.object({ body: z.object(listingFields) }),

  // Every field optional on update: the panel patches one tab at a time, and
  // requiring the whole listing back would make a price change able to blank
  // the gallery.
  update: z.object({
    body: z.object(listingFields).partial(),
  }),

  changeStatus: z.object({ body: z.object({ status }) }),

  createOption: z.object({ body: z.object(optionFields) }),
  updateOption: z.object({ body: z.object(optionFields).partial() }),
};
