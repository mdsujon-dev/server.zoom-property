import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { nextSequence } from "../../shared/counter.model";
import { diffFields, recordHistory } from "../history/history.service";
import { IProperty } from "./property.interface";
import { Property, PropertyAmenity, PropertyType } from "./property.model";

// Every read excludes soft-deleted rows; nothing here ever hard-deletes.
const liveFilter = { isDeleted: { $ne: true } };

/** The lists this module manages, by the word the URL uses. */
const OPTION_MODELS = {
  amenities: PropertyAmenity,
  types: PropertyType,
} as const;

type OptionKind = keyof typeof OPTION_MODELS;

const optionModel = (kind: string) => {
  const model = OPTION_MODELS[kind as OptionKind];
  if (!model) throw new AppError(StatusCodes.NOT_FOUND, "Unknown option list");
  return model;
};

/**
 * ZP-2026-0001.
 *
 * Year in the middle so the sequence restarts every January and a reference
 * says when it was taken on without anyone opening the record.
 */
const nextReferenceNo = async () => {
  const year = new Date().getFullYear();
  return `ZP-${year}-${await nextSequence(`property-${year}`, 4)}`;
};

/**
 * A slug that is unique among live listings.
 *
 * Two flats on the same road genuinely do have the same name, so a collision is
 * an ordinary event rather than a mistake — it gets a numeric suffix instead of
 * an error the desk cannot act on.
 */
const uniqueSlug = async (title: string, excludeId?: string) => {
  const base = slugify(title, { lower: true, strict: true }) || "listing";
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const clash = await Property.findOne({
      slug: candidate,
      ...liveFilter,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

/** Everything a listing screen needs resolved, in one place. */
const withRelations = <T>(q: T) =>
  (q as any)
    .populate({ path: "area", select: "_id name nameBn city" })
    .populate({ path: "agent", select: "_id name nameBn role roleBn phone image rating deals respondsIn languages" })
    .populate({ path: "project", select: "_id name slug" })
    .populate({ path: "coverImage", select: "_id key" })
    .populate({ path: "images", select: "_id key" })
    .populate({ path: "amenities", select: "_id name nameBn icon" }) as T;

const createProperty = async (
  payload: Partial<IProperty>,
  createdBy?: string
) => {
  const property = await Property.create({
    ...payload,
    referenceNo: await nextReferenceNo(),
    slug: await uniqueSlug(payload.title as string),
    // A listing created straight into "available" is on the market from the
    // moment it is saved, so it needs the date now rather than at the next edit.
    publishedAt: payload.status === "available" ? new Date() : undefined,
    createdBy,
  });

  await recordHistory({
    entity: "Property",
    entityId: property._id as string,
    action: "created",
    by: createdBy,
  });

  return property;
};

const getAllProperties = async (
  query: Record<string, unknown>,
  userId?: string
) => {
  // `publishedOnly=true` is what the public site asks for: a draft or an
  // archived listing is nobody's business outside the panel.
  const { publishedOnly, min, max, q, ...restQuery } = query;
  let baseFilter: Record<string, unknown> = { ...liveFilter };
  if (publishedOnly === "true") baseFilter.status = "available";

  if (q && !restQuery.searchTerm) restQuery.searchTerm = q;
  if (min !== undefined || max !== undefined) {
    restQuery.price = {
      ...(min !== undefined ? { $gte: Number(min) } : {}),
      ...(max !== undefined ? { $lte: Number(max) } : {}),
    };
  }

  const propertyQuery = new QueryBuilder(
    withRelations(Property.find(baseFilter)),
    restQuery
  )
    .search(["title", "titleBn", "referenceNo", "addressLine"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    propertyQuery.modelQuery,
    propertyQuery.countTotal(),
  ]);

  return { data, meta };
};

const getPropertyById = async (id: string, userId?: string) => {
  const filter = { _id: id, ...liveFilter };
  const property = await withRelations(Property.findOne(filter));
  if (!property) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");
  return property;
};

/**
 * The public read, by slug.
 *
 * Unscoped and unauthenticated on purpose — this is what the website calls —
 * so it answers only for listings that are actually on the market, and counts
 * the view while it is there.
 */
const getPropertyBySlug = async (slug: string) => {
  const property = await withRelations(
    Property.findOneAndUpdate(
      { slug, status: "available", ...liveFilter },
      { $inc: { views: 1 } },
      { new: true }
    )
  );
  if (!property) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");
  return property;
};

const updateProperty = async (
  id: string,
  payload: Partial<IProperty>,
  updatedBy?: string
) => {
  const existing = await Property.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");

  const changes = diffFields(existing.toObject(), payload);

  /* A price cut is the one edit the site advertises, so it has to be derived
     rather than typed: `previousPrice` is what the listing was asking before
     this save, and only when the number actually went down. A desk that can
     set the badge by hand is a desk whose "price drop" badges mean nothing. */
  const patch: Record<string, unknown> = { ...payload, updatedBy };
  if (
    typeof payload.price === "number" &&
    payload.price < existing.price
  ) {
    patch.previousPrice = existing.price;
    patch.badge = "Price drop";
  }

  if (payload.title && payload.title !== existing.title) {
    patch.slug = await uniqueSlug(payload.title, id);
  }

  // First time it goes live, stamp the date. Re-publishing something that was
  // archived keeps the original — "listed since" is when it first went up.
  if (payload.status === "available" && !existing.publishedAt) {
    patch.publishedAt = new Date();
  }

  const property = await withRelations(
    Property.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
  );

  await recordHistory({
    entity: "Property",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return property;
};

const changeStatus = async (
  id: string,
  status: IProperty["status"],
  updatedBy?: string
) => {
  const property = await Property.findOne({ _id: id, ...liveFilter });
  if (!property) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");

  const from = property.status;
  property.status = status;
  if (status === "available" && !property.publishedAt) {
    property.publishedAt = new Date();
  }
  property.updatedBy = updatedBy as never;
  await property.save();

  await recordHistory({
    entity: "Property",
    entityId: id,
    action: "updated",
    changes: [{ field: "status", from, to: status }],
    by: updatedBy,
  });

  return property;
};

const toggleFeatured = async (id: string, updatedBy?: string) => {
  const property = await Property.findOne({ _id: id, ...liveFilter });
  if (!property) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");

  property.featured = !property.featured;
  property.updatedBy = updatedBy as never;
  await property.save();
  return property;
};

/**
 * Soft delete.
 *
 * The record stays because the ledger points at it: a commission entry whose
 * property vanished is a row in the cash book that can no longer say what it
 * was for.
 */
const deleteProperty = async (id: string, deletedBy?: string) => {
  const property = await Property.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, updatedBy: deletedBy },
    { new: true }
  );
  if (!property) throw new AppError(StatusCodes.NOT_FOUND, "Listing not found");

  await recordHistory({
    entity: "Property",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return property;
};

/**
 * Retires listings whose mandate has run out.
 *
 * Called hourly from the bootstrap. Only touches listings that are still on the
 * market — an archived one is already where this would put it, and a sold one
 * must keep saying it sold.
 */
const expireStaleListings = async () => {
  const result = await Property.updateMany(
    {
      status: "available",
      expiresAt: { $ne: null, $lt: new Date() },
      ...liveFilter,
    },
    { status: "archived" }
  );
  return { expired: result.modifiedCount ?? 0 };
};

/* ── Amenities and the other managed lists ──────────────────────────────── */

const listOptions = async (kind: string, query: Record<string, unknown>) => {
  const model = optionModel(kind);
  const filter: Record<string, unknown> =
    query.activeOnly === "true" ? { isActive: true } : {};
  const searchTerm = String(query.searchTerm || "").trim();
  const hasPagination =
    query.page !== undefined ||
    query.limit !== undefined ||
    query.searchTerm !== undefined;

  if (!hasPagination) {
    const data = await model.find(filter).sort({ order: 1, name: 1 });
    return { data, meta: undefined };
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  if (searchTerm) {
    filter.$or = ["name", "nameBn", "icon", "description"].map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
  }

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort({ order: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    model.countDocuments(filter),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const createOption = async (kind: string, payload: Record<string, unknown>) =>
  optionModel(kind).create(payload);

const updateOption = async (
  kind: string,
  id: string,
  payload: Record<string, unknown>
) => {
  const option = await optionModel(kind).findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!option) throw new AppError(StatusCodes.NOT_FOUND, "Option not found");
  return option;
};

/**
 * Deleting an amenity that listings still point at would leave holes in their
 * feature lists, so it is refused rather than cascaded — deactivating it keeps
 * the existing listings honest and stops it being offered on new ones.
 */
const deleteOption = async (kind: string, id: string) => {
  if (kind === "amenities") {
    const inUse = await Property.countDocuments({
      amenities: id,
      ...liveFilter,
    });
    if (inUse) {
      throw new AppError(
        StatusCodes.CONFLICT,
        `${inUse} listing(s) use this amenity. Deactivate it instead.`
      );
    }
  } else if (kind === "types") {
    const option = await optionModel(kind).findById(id);
    if (!option) throw new AppError(StatusCodes.NOT_FOUND, "Option not found");
    
    const inUse = await Property.countDocuments({
      type: option.name,
      ...liveFilter,
    });
    if (inUse) {
      throw new AppError(
        StatusCodes.CONFLICT,
        `${inUse} listing(s) use this property type. Deactivate it instead.`
      );
    }
  }

  const option = await optionModel(kind).findByIdAndDelete(id);
  if (!option) throw new AppError(StatusCodes.NOT_FOUND, "Option not found");
  return option;
};

export const PropertyService = {
  createProperty,
  getAllProperties,
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  changeStatus,
  toggleFeatured,
  deleteProperty,
  expireStaleListings,
  listOptions,
  createOption,
  updateOption,
  deleteOption,
};
