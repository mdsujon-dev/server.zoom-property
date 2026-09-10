import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { diffFields, recordHistory } from "../history/history.service";
import { IBlogCategory, IBlogPost } from "./blog.interface";
import { BlogCategory, BlogPost } from "./blog.model";
import User from "../auth/auth.model";
// Registers the schema `bylineFor` populates against.
import "../designation/designation.model";

const liveFilter = { isDeleted: { $ne: true } };

const uniqueSlug = async (title: string, excludeId?: string) => {
  const base = slugify(title, { lower: true, strict: true }) || "post";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await BlogPost.findOne({
      slug: candidate,
      ...liveFilter,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

/** 200 words a minute, floored at one — "0 min read" reads as broken. */
const readingTime = (html?: string) => {
  if (!html) return 1;
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

const withRelations = <T>(q: T) =>
  (q as any)
    .populate({ path: "category", select: "_id name nameBn slug" })
    .populate({ path: "coverImage", select: "_id key" })
    .populate({ path: "thumbnail", select: "_id key" })
    .populate({ path: "author.avatar", select: "_id key" }) as T;

/**
 * The byline, taken from whoever is working on the article.
 *
 * Set from the writer on create and reset from the editor on every update, so
 * the name on the article is whoever last touched it. That is a deliberate
 * choice: here the byline means "ask this person about it" rather than "this
 * person typed the first draft", and a stale name sends the reader to somebody
 * who no longer knows the piece.
 *
 * Still copied rather than referenced — the values are written into the
 * article, so an author changing their photograph later does not silently
 * restyle every article they ever touched.
 *
 * An explicit `author` in the payload always wins, which is how a guest
 * contributor keeps their byline through an editor's corrections.
 */
const bylineFor = async (
  userId?: string,
  provided?: Partial<IBlogPost>["author"]
) => {
  if (provided?.name) return provided;
  if (!userId) return provided;

  const user = await User.findById(userId)
    .select("name profilePhoto designationId")
    .populate({ path: "designationId", select: "name" })
    .lean<{ name?: string; profilePhoto?: string; designationId?: { name?: string } }>();

  if (!user?.name) return provided;

  return {
    name: user.name,
    role: user.designationId?.name,
    avatarUrl: user.profilePhoto,
  };
};

const createPost = async (payload: Partial<IBlogPost>, createdBy?: string) => {
  const post = await BlogPost.create({
    ...payload,
    author: await bylineFor(createdBy, payload.author),
    slug: await uniqueSlug(payload.title as string),
    readMinutes: readingTime(payload.content),
    publishedAt: payload.status === "published" ? new Date() : undefined,
    createdBy,
  });

  await recordHistory({
    entity: "BlogPost",
    entityId: post._id as string,
    action: "created",
    by: createdBy,
  });

  return post;
};

const getAllPosts = async (query: Record<string, unknown>) => {
  const { publishedOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (publishedOnly === "true") baseFilter.status = "published";

  const postQuery = new QueryBuilder(
    withRelations(BlogPost.find(baseFilter).select("-content -contentBn")),
    restQuery
  )
    .search(["title", "titleBn", "excerpt", "tags"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    postQuery.modelQuery,
    postQuery.countTotal(),
  ]);

  return { data, meta };
};

const getPostById = async (id: string) => {
  const post = await withRelations(BlogPost.findOne({ _id: id, ...liveFilter }));
  if (!post) throw new AppError(StatusCodes.NOT_FOUND, "Article not found");
  return post;
};

/** The public read, by slug. Counts the view while it is there. */
const getPostBySlug = async (slug: string) => {
  const post = await withRelations(
    BlogPost.findOneAndUpdate(
      { slug, status: "published", ...liveFilter },
      { $inc: { views: 1 } },
      { new: true }
    )
  );
  if (!post) throw new AppError(StatusCodes.NOT_FOUND, "Article not found");
  return post;
};

const updatePost = async (
  id: string,
  payload: Partial<IBlogPost>,
  updatedBy?: string
) => {
  const existing = await BlogPost.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Article not found");

  const changes = diffFields(existing.toObject(), payload);
  const patch: Record<string, unknown> = {
    ...payload,
    // Whoever is editing becomes the byline, unless the payload names one.
    author: await bylineFor(updatedBy, payload.author),
    updatedBy,
  };

  if (payload.title && payload.title !== existing.title) {
    patch.slug = await uniqueSlug(payload.title, id);
  }
  if (payload.content !== undefined) {
    patch.readMinutes = readingTime(payload.content);
  }
  // Publishing stamps the date once. Re-publishing something that was pulled
  // keeps the original — "published on" is when readers first saw it.
  if (payload.status === "published" && !existing.publishedAt) {
    patch.publishedAt = new Date();
  }

  const post = await withRelations(
    BlogPost.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
  );

  await recordHistory({
    entity: "BlogPost",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return post;
};

const deletePost = async (id: string, deletedBy?: string) => {
  const post = await BlogPost.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, updatedBy: deletedBy },
    { new: true }
  );
  if (!post) throw new AppError(StatusCodes.NOT_FOUND, "Article not found");

  await recordHistory({
    entity: "BlogPost",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return post;
};

/* ── Categories ─────────────────────────────────────────────────────────── */

const listCategories = async (query: Record<string, unknown>) => {
  const filter = query.activeOnly === "true" ? { isActive: true } : {};
  return BlogCategory.find(filter).sort({ order: 1, name: 1 });
};

const createCategory = async (payload: Partial<IBlogCategory>) =>
  BlogCategory.create({
    ...payload,
    slug: slugify(payload.name as string, { lower: true, strict: true }),
  });

const updateCategory = async (id: string, payload: Partial<IBlogCategory>) => {
  const patch: Record<string, unknown> = { ...payload };
  if (payload.name) {
    patch.slug = slugify(payload.name, { lower: true, strict: true });
  }
  const category = await BlogCategory.findByIdAndUpdate(id, patch, { new: true });
  if (!category) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  return category;
};

/**
 * Refused while articles still point at it — an article with no category falls
 * out of every filter on the blog index and is then only reachable by its own
 * URL, which nobody has.
 */
const deleteCategory = async (id: string) => {
  const inUse = await BlogPost.countDocuments({ category: id, ...liveFilter });
  if (inUse) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `${inUse} article(s) use this category. Deactivate it instead.`
    );
  }

  const category = await BlogCategory.findByIdAndDelete(id);
  if (!category) throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  return category;
};

export const BlogService = {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
