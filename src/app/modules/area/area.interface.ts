import { Document, Types } from "mongoose";

/**
 * A neighbourhood.
 *
 * People here search by area name before anything else — "Gulshan", not
 * "3-bed under 4 crore" — so an area is a first-class record with its own page,
 * its own numbers and its own photograph, rather than a string typed onto each
 * listing.
 *
 * The market figures are held rather than computed. A median taken from the
 * agency's own listings would swing on a single penthouse and would report what
 * this agency happens to be selling, not what the area is worth; the desk
 * enters what the market says.
 */
export interface IArea extends Document {
  name: string;
  nameBn?: string;
  /** URL segment for `/areas/[slug]`. */
  slug: string;
  city: string;

  /** Short service promise shown on the area card. */
  tagline?: string;
  taglineBn?: string;

  /** Median asking price for a sale listing in this area, BDT. */
  medianPrice?: number;
  /** Average price per square foot, BDT. */
  pricePerSqft?: number;
  /** Estimated annual gross rental yield, as written: "5.2%". */
  rentalYield?: string;

  image?: Types.ObjectId;

  /** One line on why people choose it — not marketing filler. */
  note?: string;
  noteBn?: string;
  securityTier?: string;
  metroConnectivity?: string;

  /** Sort position in the areas list, lowest first. */
  order: number;
  featured: boolean;
  /**
   * Picked for the home page.
   *
   * A deliberate choice by the desk rather than a side effect of ordering
   * or of `featured`: the home page shows a handful, and which handful is
   * an editorial decision that should survive someone reordering the list.
   */
  isHome: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
