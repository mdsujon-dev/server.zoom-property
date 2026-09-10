import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { Property } from "../property/property.model";
import { IMilestone, IProject } from "./project.interface";
import { Project } from "./project.model";

const liveFilter = { isDeleted: { $ne: true } };

const uniqueSlug = async (name: string, excludeId?: string) => {
  const base = slugify(name, { lower: true, strict: true }) || "project";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await Project.findOne({
      slug: candidate,
      ...liveFilter,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

/**
 * Completion, from the programme rather than from the form.
 *
 * A project page that lets somebody type "85%" beside a milestone list adding
 * to 40% is a page that has stopped meaning anything. The number is the sum of
 * the milestones marked done, and the only way to move it is to tick one.
 */
const progressFrom = (milestones: IMilestone[] = []) =>
  Math.min(
    100,
    Math.round(
      milestones
        .filter((m) => m.completed)
        .reduce((sum, m) => sum + (m.percent || 0), 0)
    )
  );

const withRelations = <T>(q: T) =>
  (q as any)
    .populate({ path: "area", select: "_id name nameBn city" })
    .populate({ path: "coverImage", select: "_id key" })
    .populate({ path: "images", select: "_id key" })
    .populate({ path: "video.poster", select: "_id key" }) as T;

const createProject = async (payload: Partial<IProject>, createdBy?: string) => {
  const project = await Project.create({
    ...payload,
    slug: await uniqueSlug(payload.name as string),
    progress: progressFrom(payload.milestones as IMilestone[]),
    createdBy,
  });

  await recordHistory({
    entity: "Project",
    entityId: project._id as string,
    action: "created",
    by: createdBy,
  });

  return project;
};

const getAllProjects = async (query: Record<string, unknown>) => {
  const { activeOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (activeOnly === "true") baseFilter.isActive = true;

  const projectQuery = new QueryBuilder(
    withRelations(Project.find(baseFilter)),
    restQuery
  )
    .search(["name", "nameBn", "developer", "rajukPermitNo"])
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

/**
 * One project by its slug, for the website.
 *
 * Inactive developments are not found rather than hidden: a project switched
 * off in the panel should 404 on the site, not render an empty page.
 */
const getProjectBySlug = async (slug: string) => {
  const project = await withRelations(
    Project.findOne({ slug, isActive: true, ...liveFilter })
  );
  if (!project) throw new AppError(StatusCodes.NOT_FOUND, "Project not found");

  const listings = await Property.find({
    project: (project as any)._id,
    status: "available",
    ...liveFilter,
  })
    .select("_id slug referenceNo title price beds baths size coverImage")
    .populate({ path: "coverImage", select: "_id key" })
    .sort({ createdAt: -1 });

  return { project, listings };
};

/** One project, with the listings that sit inside it. */
const getProjectById = async (id: string) => {
  const project = await withRelations(
    Project.findOne({ _id: id, ...liveFilter })
  );
  if (!project) throw new AppError(StatusCodes.NOT_FOUND, "Project not found");

  const listings = await Property.find({ project: id, ...liveFilter })
    .select("_id referenceNo title status price beds baths size")
    .sort({ createdAt: -1 });

  return { project, listings };
};

const updateProject = async (
  id: string,
  payload: Partial<IProject>,
  updatedBy?: string
) => {
  const existing = await Project.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Project not found");

  const changes = diffFields(existing.toObject(), payload);
  const patch: Record<string, unknown> = { ...payload, updatedBy };
  if (payload.name && payload.name !== existing.name) {
    patch.slug = await uniqueSlug(payload.name, id);
  }
  if (payload.milestones) {
    patch.progress = progressFrom(payload.milestones as IMilestone[]);
  }

  const project = await withRelations(
    Project.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
  );

  await recordHistory({
    entity: "Project",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return project;
};

/**
 * Refused while listings still point at it — a unit whose development has been
 * deleted loses the build progress and the permit number that were the reason
 * anyone trusted it.
 */
const deleteProject = async (id: string, deletedBy?: string) => {
  const inUse = await Property.countDocuments({ project: id, ...liveFilter });
  if (inUse) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `${inUse} listing(s) belong to this project. Detach them first.`
    );
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isActive: false, updatedBy: deletedBy },
    { new: true }
  );
  if (!project) throw new AppError(StatusCodes.NOT_FOUND, "Project not found");

  await recordHistory({
    entity: "Project",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return project;
};

export const ProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  getProjectBySlug,
  updateProject,
  deleteProject,
};
