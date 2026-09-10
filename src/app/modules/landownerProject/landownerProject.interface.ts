import { Document, Types } from "mongoose";

/**
 * A completed joint venture, shown to landowners as evidence.
 *
 * Its own collection rather than a `Project` with a flag: a JV case study is a
 * finished building being cited, not a development being sold. It carries the
 * landowner's share and the year it was handed over - numbers no listing has -
 * and it stays on the page long after the units are gone.
 */
export interface ILandownerProject extends Document {
  name: string;
  nameBn?: string;
  location?: string;
  locationBn?: string;

  /** Plot size in katha, as land is measured here. */
  landSizeKatha?: number;
  floors?: number;
  /** The landowner's share of the finished building, per cent. */
  ownerSharePercent?: number;
  completedYear?: number;

  image?: Types.ObjectId;

  /** Unpublished by default - a case study goes up when somebody decides. */
  isPublished: boolean;
  /** Picked for the landowners page's headline row. */
  isHome: boolean;
  order: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
