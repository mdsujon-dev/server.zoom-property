import { StatusCodes } from "http-status-codes";

import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { ILandownerBlock } from "./landownerProject.interface";
import { LandownerProject } from "./landownerProject.model";

const liveFilter = { isDeleted: { $ne: true } };

const withRelations = <T>(q: T) =>
  (q as any).populate({ path: "image", select: "_id key" }) as T;

const createProject = async (
  payload: Partial<ILandownerBlock>,
  createdBy?: string
) => {
  const project = await LandownerProject.create({ ...payload, createdBy });

  await recordHistory({
    entity: "LandownerProject",
    entityId: project._id as string,
    action: "created",
    by: createdBy,
  });

  return project;
};

const getAllProjects = async (query: Record<string, unknown>) => {
  const { publishedOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (publishedOnly === "true") baseFilter.isPublished = true;

  const projectQuery = new QueryBuilder(
    withRelations(LandownerProject.find(baseFilter)),
    { sort: "order", ...restQuery }
  )
    .search(["title", "titleBn"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    projectQuery.modelQuery,
    projectQuery.countTotal(),
  ]);

  return { data, meta };
};

const getProjectById = async (id: string) => {
  const project = await withRelations(
    LandownerProject.findOne({ _id: id, ...liveFilter })
  );
  if (!project) throw new AppError(StatusCodes.NOT_FOUND, "Block not found");
  return project;
};

const updateProject = async (
  id: string,
  payload: Partial<ILandownerBlock>,
  updatedBy?: string
) => {
  const before = await LandownerProject.findOne({ _id: id, ...liveFilter });
  if (!before) throw new AppError(StatusCodes.NOT_FOUND, "Block not found");

  const project = await withRelations(
    LandownerProject.findOneAndUpdate(
      { _id: id, ...liveFilter },
      { ...payload, updatedBy },
      { new: true }
    )
  );

  await recordHistory({
    entity: "LandownerProject",
    entityId: id,
    action: "updated",
    by: updatedBy,
    changes: diffFields(before.toObject(), payload),
  });

  return project;
};

/** Soft delete: the page forgets it, the history does not. */
const deleteProject = async (id: string, deletedBy?: string) => {
  const project = await LandownerProject.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isPublished: false, updatedBy: deletedBy },
    { new: true }
  );
  if (!project) throw new AppError(StatusCodes.NOT_FOUND, "Block not found");

  await recordHistory({
    entity: "LandownerProject",
    entityId: id,
    // "archived" is what this history calls a soft delete.
    action: "archived",
    by: deletedBy,
  });

  return project;
};

export const LandownerProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

export default LandownerProjectService;
