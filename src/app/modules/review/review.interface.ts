import { Document, Types } from "mongoose";

/**
 * A client review.
 *
 * `property` matters as much as the quote does: an unattributed testimonial
 * reads as invented, and tying it to something the agency actually sold is what
 * makes it worth printing. `propertyLabel` carries the wording for deals that
 * closed before this system existed, or that the client would rather not have
 * linked.
 */
export interface IReview extends Document {
  clientName: string;
  clientNameBn?: string;
  /** What they do, printed under the name. */
  role?: string;
  roleBn?: string;

  quote: string;
  quoteBn?: string;
  rating: number;

  photo?: Types.ObjectId;

  property?: Types.ObjectId;
  /** What they bought or rented, when it is not a listing on file. */
  propertyLabel?: string;

  /**
   * Present when the client said it on camera. The quote is still written out:
   * it is what the card shows before anyone presses play, and it is the only
   * version a crawler or a muted visitor ever reads.
   */
  video?: {
    youtubeUrl?: string;
    poster?: Types.ObjectId;
    duration?: string;
  };

  /** Nothing appears on the site until somebody approves it. */
  isPublished: boolean;
  featured: boolean;
  /**
   * Picked for the home page.
   *
   * Nothing ticked and the home strip falls back to the newest published
   * reviews, so the block is never empty while the desk decides.
   */
  isHome: boolean;
  order: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
