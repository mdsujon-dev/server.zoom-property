import { StatusCodes } from "http-status-codes";

import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { IShowcaseVideo } from "./showcaseVideo.interface";
import { ShowcaseVideo } from "./showcaseVideo.model";

const liveFilter = { isDeleted: { $ne: true } };

const withRelations = <T>(q: T) =>
  (q as any).populate({ path: "poster", select: "_id key" }) as T;

const createVideo = async (
  payload: Partial<IShowcaseVideo>,
  createdBy?: string
) => {
  const video = await ShowcaseVideo.create({ ...payload, createdBy });

  await recordHistory({
    entity: "ShowcaseVideo",
    entityId: video._id as string,
    action: "created",
    by: createdBy,
  });

  return video;
};

const getAllVideos = async (query: Record<string, unknown>) => {
  const { publishedOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (publishedOnly === "true") baseFilter.isPublished = true;

  const videoQuery = new QueryBuilder(
    withRelations(ShowcaseVideo.find(baseFilter)),
    { sort: "order", ...restQuery }
  )
    .search(["title", "titleBn", "category", "location"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    videoQuery.modelQuery,
    videoQuery.countTotal(),
  ]);

  return { data, meta };
};

const getVideoById = async (id: string) => {
  const video = await withRelations(
    ShowcaseVideo.findOne({ _id: id, ...liveFilter })
  );
  if (!video) throw new AppError(StatusCodes.NOT_FOUND, "Video not found");
  return video;
};

const updateVideo = async (
  id: string,
  payload: Partial<IShowcaseVideo>,
  updatedBy?: string
) => {
  const before = await ShowcaseVideo.findOne({ _id: id, ...liveFilter });
  if (!before) throw new AppError(StatusCodes.NOT_FOUND, "Video not found");

  const video = await withRelations(
    ShowcaseVideo.findOneAndUpdate(
      { _id: id, ...liveFilter },
      { ...payload, updatedBy },
      { new: true }
    )
  );

  await recordHistory({
    entity: "ShowcaseVideo",
    entityId: id,
    action: "updated",
    by: updatedBy,
    changes: diffFields(before.toObject(), payload),
  });

  return video;
};

/**
 * Soft delete, like every other record here: the carousel forgets it, the
 * history does not.
 */
const deleteVideo = async (id: string, deletedBy?: string) => {
  const video = await ShowcaseVideo.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isPublished: false, updatedBy: deletedBy },
    { new: true }
  );
  if (!video) throw new AppError(StatusCodes.NOT_FOUND, "Video not found");

  await recordHistory({
    entity: "ShowcaseVideo",
    entityId: id,
    // "archived" is what this history calls a soft delete.
    action: "archived",
    by: deletedBy,
  });

  return video;
};

export const ShowcaseVideoService = {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};

export default ShowcaseVideoService;
