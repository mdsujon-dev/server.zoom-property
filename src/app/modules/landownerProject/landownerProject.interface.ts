import { Document, Types } from "mongoose";

/**
 * One block on the landowners page: a photograph, a heading, and a passage.
 *
 * Three fields and no more. What a landowner needs to read varies - the terms,
 * the guarantees, a finished building - and pinning that to a fixed set of
 * columns meant every block had to be the same kind of thing. A heading and a
 * body the desk can format covers all of them.
 *
 * `description` is HTML from the panel's editor, not plain text: the desk
 * writes lists and bold terms here, and flattening those to a string would
 * throw the formatting away on save.
 */
export interface ILandownerBlock extends Document {
  title: string;
  titleBn?: string;

  /** HTML from the panel's rich-text editor. */
  description?: string;
  descriptionBn?: string;

  image?: Types.ObjectId;

  /** Unpublished by default - a case study goes up when somebody decides. */
  isPublished: boolean;
  /** Shown on the landowners page. */
  isHome: boolean;
  order: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
