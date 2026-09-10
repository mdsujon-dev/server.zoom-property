import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const author = z.object({
  avatarUrl: z.string().optional(),
  name: z.string().min(1, "Author name is required"),
  nameBn: z.string().optional(),
  role: z.string().optional(),
  roleBn: z.string().optional(),
  avatar: objectId.optional().nullable(),
});

const postFields = {
  title: z.string().min(1, "Title is required"),
  titleBn: z.string().optional(),

  excerpt: z.string().optional(),
  excerptBn: z.string().optional(),

  content: z.string().optional(),
  contentBn: z.string().optional(),

  // Capped at what a search engine will actually print, so the desk finds out
  // here rather than from a truncated result page.
  metaTitle: z.string().max(70, "Keep the meta title under 70 characters").optional(),
  metaTitleBn: z.string().max(70).optional(),
  metaDescription: z
    .string()
    .max(160, "Keep the meta description under 160 characters")
    .optional(),
  metaDescriptionBn: z.string().max(160).optional(),

  category: objectId,
  tags: z.array(z.string()).optional(),

  coverImage: objectId.optional().nullable(),

  thumbnail: objectId.optional().nullable(),
  // Optional: the API fills it in from the signed-in writer.
  author: author.optional(),

  // `readMinutes`, `slug` and `publishedAt` are absent on purpose: all three
  // are derived on save, and a form that could set them could make the article
  // disagree with itself.
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
};

const categoryFields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
};

export const blogValidation = {
  create: z.object({ body: z.object(postFields) }),
  update: z.object({ body: z.object({ ...postFields, author: author.optional() }).partial() }),
  createCategory: z.object({ body: z.object(categoryFields) }),
  updateCategory: z.object({ body: z.object(categoryFields).partial() }),
};
