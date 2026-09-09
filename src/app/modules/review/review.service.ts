import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { IReview } from "./review.interface";
import { Review } from "./review.model";

const liveFilter = { isDeleted: { $ne: true } };

const withRelations = <T>(q: T) =>
  (q as any)
    .populate({ path: "photo", select: "_id key" })
    .populate({ path: "video.poster", select: "_id key" })
    .populate({ path: "property", select: "_id title referenceNo slug" }) as T;

const createReview = async (payload: Partial<IReview>, createdBy?: string) => {
  const review = await Review.create({ ...payload, createdBy });

  await recordHistory({
    entity: "Review",
    entityId: review._id as string,
    action: "created",
    by: createdBy,
  });

  return review;
};

const getAllReviews = async (query: Record<string, unknown>) => {
  const { publishedOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (publishedOnly === "true") baseFilter.isPublished = true;

  const reviewQuery = new QueryBuilder(
    withRelations(Review.find(baseFilter)),
    restQuery
  )
    .search(["clientName", "clientNameBn", "quote", "propertyLabel"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    reviewQuery.modelQuery,
    reviewQuery.countTotal(),
  ]);

  return { data, meta };
};

const getReviewById = async (id: string) => {
  const review = await withRelations(Review.findOne({ _id: id, ...liveFilter }));
  if (!review) throw new AppError(StatusCodes.NOT_FOUND, "Review not found");
  return review;
};

const updateReview = async (
  id: string,
  payload: Partial<IReview>,
  updatedBy?: string
) => {
  const existing = await Review.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Review not found");

  const changes = diffFields(existing.toObject(), payload);
  const review = await withRelations(
    Review.findByIdAndUpdate(
      id,
      { ...payload, updatedBy },
      { new: true, runValidators: true }
    )
  );

  await recordHistory({
    entity: "Review",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return review;
};

/** Approve or pull a review. The one action this screen exists for. */
const togglePublished = async (id: string, updatedBy?: string) => {
  const review = await Review.findOne({ _id: id, ...liveFilter });
  if (!review) throw new AppError(StatusCodes.NOT_FOUND, "Review not found");

  review.isPublished = !review.isPublished;
  review.updatedBy = updatedBy as never;
  await review.save();
  return review;
};

const deleteReview = async (id: string, deletedBy?: string) => {
  const review = await Review.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isPublished: false, updatedBy: deletedBy },
    { new: true }
  );
  if (!review) throw new AppError(StatusCodes.NOT_FOUND, "Review not found");

  await recordHistory({
    entity: "Review",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return review;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  togglePublished,
  deleteReview,
};
