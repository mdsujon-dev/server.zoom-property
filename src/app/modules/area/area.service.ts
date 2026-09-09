import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { Property } from "../property/property.model";
import { IArea } from "./area.interface";
import { Area } from "./area.model";

const liveFilter = { isDeleted: { $ne: true } };

const uniqueSlug = async (name: string, excludeId?: string) => {
  const base = slugify(name, { lower: true, strict: true }) || "area";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await Area.findOne({
      slug: candidate,
      ...liveFilter,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

const createArea = async (payload: Partial<IArea>, createdBy?: string) => {
  if (payload.order === undefined || payload.order === null || payload.order === 0) {
    const maxArea = await Area.findOne(liveFilter).sort({ order: -1 }).select("order");
    payload.order = maxArea && typeof maxArea.order === "number" ? maxArea.order + 1 : 1;
  }

  const area = await Area.create({
    ...payload,
    slug: await uniqueSlug(payload.name as string),
    createdBy,
  });

  await recordHistory({
    entity: "Area",
    entityId: area._id as string,
    action: "created",
    by: createdBy,
  });

  return area;
};

/**
 * The area list, each row carrying its live listing count.
 *
 * The count is one aggregate over the whole page rather than a query per row:
 * the areas screen shows thirty at a time, and thirty round trips to answer
 * "how many" is how a list page becomes a loading spinner.
 */
const getAllAreas = async (query: Record<string, unknown>) => {
  const { activeOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (activeOnly === "true") baseFilter.isActive = true;

  const queryParams = { sort: "order", ...restQuery };

  const areaQuery = new QueryBuilder(
    Area.find(baseFilter).populate({ path: "image", select: "_id key" }),
    queryParams
  )
    .search(["name", "nameBn", "city"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [rows, meta] = await Promise.all([
    areaQuery.modelQuery,
    areaQuery.countTotal(),
  ]);

  const counts = await Property.aggregate<{ _id: unknown; count: number }>([
    {
      $match: {
        area: { $in: rows.map((a: any) => a._id) },
        status: "available",
        isDeleted: { $ne: true },
      },
    },
    { $group: { _id: "$area", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = rows.map((a: any) => ({
    ...a.toObject(),
    listings: countMap.get(String(a._id)) ?? 0,
  }));

  return { data, meta };
};

const getAreaById = async (id: string) => {
  const area = await Area.findOne({ _id: id, ...liveFilter }).populate({
    path: "image",
    select: "_id key",
  });
  if (!area) throw new AppError(StatusCodes.NOT_FOUND, "Area not found");
  return area;
};

const updateArea = async (
  id: string,
  payload: Partial<IArea>,
  updatedBy?: string
) => {
  const existing = await Area.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Area not found");

  const changes = diffFields(existing.toObject(), payload);
  const patch: Record<string, unknown> = { ...payload, updatedBy };
  if (payload.name && payload.name !== existing.name) {
    patch.slug = await uniqueSlug(payload.name, id);
  }

  const area = await Area.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  }).populate({ path: "image", select: "_id key" });

  await recordHistory({
    entity: "Area",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return area;
};

/**
 * Refused while listings still point at it.
 *
 * Every listing has to say where it is; deleting the area out from under one
 * would leave a card that says nothing about location, which is the first thing
 * anyone reads. Deactivating keeps the existing listings intact and stops the
 * area being offered on new ones.
 */
const deleteArea = async (id: string, deletedBy?: string) => {
  const inUse = await Property.countDocuments({ area: id, ...liveFilter });
  if (inUse) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `${inUse} listing(s) are in this area. Deactivate it instead.`
    );
  }

  const area = await Area.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isActive: false, updatedBy: deletedBy },
    { new: true }
  );
  if (!area) throw new AppError(StatusCodes.NOT_FOUND, "Area not found");

  await recordHistory({
    entity: "Area",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return area;
};

export const AreaService = {
  createArea,
  getAllAreas,
  getAreaById,
  updateArea,
  deleteArea,
};
