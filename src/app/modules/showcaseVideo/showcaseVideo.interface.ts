import { Document, Types } from "mongoose";

/**
 * A film on the home page's showcase carousel.
 *
 * Its own record rather than a field on a listing, because these are not
 * listing videos: a construction update belongs to a development, a channel
 * trailer belongs to nothing, and the desk orders them as a reel. Tying them
 * to a property would mean a video could not exist without one.
 *
 * `poster` is a media document rather than a YouTube thumbnail. The frame the
 * carousel opens on is an editorial choice - the still that sells the film -
 * and YouTube's automatic pick is rarely it.
 */
export interface IShowcaseVideo extends Document {
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;

  /** The film itself. YouTube or Vimeo. */
  youtubeUrl: string;
  poster?: Types.ObjectId;
  /** As written on the card: "03:45". Not a number - nobody types seconds. */
  duration?: string;

  /** The pill on the still: "Penthouse Tour", "Construction Update". */
  category?: string;
  categoryBn?: string;

  location?: string;
  locationBn?: string;

  /** As written: "24.5K views". A count we do not own and cannot recompute. */
  views?: string;
  channelName?: string;

  /** Unpublished by default - a film goes up when somebody decides it should. */
  isPublished: boolean;
  /** Picked for the home carousel. */
  isHome: boolean;
  order: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
