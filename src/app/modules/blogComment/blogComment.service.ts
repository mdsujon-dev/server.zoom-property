import { StatusCodes } from "http-status-codes";
import { SortOrder } from "mongoose";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { IBlogComment } from "./blogComment.interface";

/**
 * A page of results.
 *
 * Declared here because this module was written against a codebase that keeps
 * it in `interfaces/common`; this one has no such file, and one local type is
 * better than a shared file with a single user.
 */
interface IGenericResponse<T> {
  meta: { page: number; limit: number; total: number };
  data: T;
}
import { BlogComment } from "./blogComment.model";

const createBlogComment = async (payload: IBlogComment): Promise<IBlogComment> => {
  const result = await BlogComment.create(payload);
  return result;
};

const getApprovedCommentsForPost = async (postId: string): Promise<IBlogComment[]> => {
  const result = await BlogComment.find({ post: postId, status: "approved" }).sort({
    createdAt: -1,
  });
  return result;
};

const getAllBlogComments = async (
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IBlogComment[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    // `sortOrder` arrives as a plain string from the query; Mongoose wants
    // its own union, and anything that is not "asc" is treated as descending.
    sortConditions[sortBy] = sortOrder === "asc" ? "asc" : "desc";
  } else {
    sortConditions["createdAt"] = -1;
  }

  const result = await BlogComment.find({})
    .populate("post", "title slug")
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await BlogComment.countDocuments();

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateBlogCommentStatus = async (
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<IBlogComment | null> => {
  const result = await BlogComment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Comment not found");
  }
  return result;
};

const deleteBlogComment = async (id: string): Promise<IBlogComment | null> => {
  const result = await BlogComment.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Comment not found");
  }
  return result;
};

export const blogCommentService = {
  createBlogComment,
  getApprovedCommentsForPost,
  getAllBlogComments,
  updateBlogCommentStatus,
  deleteBlogComment,
};
