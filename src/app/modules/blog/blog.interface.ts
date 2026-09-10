import { Document, Types } from "mongoose";

/** Draft until somebody publishes it. Nothing goes live by being saved. */
export type PostStatus = "draft" | "published";

/**
 * Who wrote it, as the site prints it.
 *
 * Embedded rather than a reference to a login, because the byline and the
 * account are not the same thing: guest contributors and the managing director
 * both get a byline, and neither needs a way into the panel to have one.
 */
export interface IPostAuthor {
  name: string;
  nameBn?: string;
  role?: string;
  roleBn?: string;
  /** A media document, when somebody picked one deliberately. */
  avatar?: Types.ObjectId;
  /**
   * The writer's own profile photograph, copied at the moment of writing.
   *
   * A URL rather than a reference, and a copy rather than a lookup: the byline
   * records who wrote the article on the day, and it should not change because
   * that person later updated their photograph or left the company.
   */
  avatarUrl?: string;
}

export interface IBlogPost extends Document {
  title: string;
  titleBn?: string;
  /** URL segment for `/blog/[slug]`. */
  slug: string;

  /** The card summary. Written, not truncated from the body. */
  excerpt?: string;
  excerptBn?: string;

  /** The article itself, as HTML from the editor. */
  content?: string;
  contentBn?: string;

  /**
   * What a search result and a shared link show.
   *
   * Separate from `title` and `excerpt` on purpose: a headline is written to
   * be read on the page, where the section around it supplies the context. A
   * search result has no context, so it is often a different sentence. Left
   * blank, the site falls back to the title and the excerpt.
   */
  metaTitle?: string;
  metaTitleBn?: string;
  metaDescription?: string;
  metaDescriptionBn?: string;

  category: Types.ObjectId;
  tags: string[];

  /** The wide image on the article page. */
  coverImage?: Types.ObjectId;
  /**
   * The card image on the index.
   *
   * Separate from the cover because the two crops are different jobs: a banner
   * is wide and has text over it, a card is close and has to read at a couple
   * of hundred pixels. Left empty, the card falls back to the cover.
   */
  thumbnail?: Types.ObjectId;
  author: IPostAuthor;

  /**
   * Reading time in minutes.
   *
   * Computed from the body on save at 200 words a minute, which is close
   * enough and never disagrees with the article the way a hand-typed number
   * does after an edit.
   */
  readMinutes: number;

  status: PostStatus;
  publishedAt?: Date;

  /** The one article the blog index leads on. */
  featured: boolean;
  trending: boolean;
  views: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** A blog category — "Market", "Legal", "Architecture". */
export interface IBlogCategory extends Document {
  name: string;
  nameBn?: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
}
