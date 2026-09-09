import { Document, Types } from "mongoose";

/**
 * What the listing is for.
 *
 * `price` means different things on either side of this — a sale price on
 * "sale", a monthly rent on "rent" — so every screen that prints money has to
 * read this first. Keeping them in one collection rather than two is
 * deliberate: the same flat is listed for sale this year and let the next, and
 * splitting them would mean moving the record and losing its history.
 */
export type Purpose = "sale" | "rent";

export type PropertyType =
  | "apartment"
  | "duplex"
  | "house"
  | "commercial"
  | "land";

/**
 * Where the listing is in its life.
 *
 *  draft      — being written; not on the site
 *  available  — on the market
 *  reserved   — money has changed hands but it has not completed
 *  sold       — completed sale
 *  rented     — let
 *  archived   — withdrawn, or expired by the nightly sweep
 *
 * `sold`/`rented`/`archived` all keep the record; nothing here ever deletes a
 * listing, because "what did we sell in March" is a question somebody asks in
 * September.
 */
export type PropertyStatus =
  | "draft"
  | "available"
  | "reserved"
  | "sold"
  | "rented"
  | "archived";

/** The corner flash on a listing card. Cosmetic, and deliberately a short list. */
export type PropertyBadge =
  | "New"
  | "Featured"
  | "Exclusive"
  | "Verified"
  | "Price drop";

export type Furnishing =
  | "Unfurnished"
  | "Semi-furnished"
  | "Fully furnished";

export interface IProperty extends Document {
  /** ZP-2026-0001. Issued by the app, never typed, and printed on everything. */
  referenceNo: string;

  title: string;
  /** Bangla title. The site is bilingual; a listing without it falls back to `title`. */
  titleBn?: string;
  /** URL segment for `/properties/[slug]`. Unique among live listings. */
  slug: string;

  purpose: Purpose;
  type: PropertyType;
  status: PropertyStatus;

  /** Sale price, or monthly rent when `purpose` is "rent". Always BDT. */
  price: number;
  /**
   * What it was asking before the last cut.
   *
   * Set by the service whenever `price` moves down, not by the form: a "price
   * drop" badge a desk can type in by hand is a badge that means nothing.
   */
  previousPrice?: number;
  /** Monthly service charge, on rentals. Separate from rent because tenants ask. */
  serviceCharge?: number;

  area: Types.ObjectId;
  city: string;
  /** House and road, when the owner is willing to publish it. */
  addressLine?: string;

  beds: number;
  baths: number;
  /** Covered area in sq ft. */
  size: number;
  /** Land size in katha — only meaningful for houses and land. */
  katha?: number;
  floor?: string;
  parking?: number;

  furnishing: Furnishing;
  /** Free text: "Ready", "Dec 2027". Not a date — half of them are a quarter. */
  handover?: string;

  /** The first thing a buyer here asks about. */
  rajukApproved: boolean;
  hasVirtualTour: boolean;
  virtualTourUrl?: string;
  /** A YouTube or Vimeo walkthrough. The player loads only when pressed. */
  videoUrl?: string;

  /** The card image, and the first frame of the gallery. */
  coverImage?: Types.ObjectId;
  /** The rest of the set, in the order the gallery shows them. */
  images: Types.ObjectId[];

  amenities: Types.ObjectId[];

  /**
   * The long write-up, one string per paragraph.
   *
   * Paragraphs rather than a single blob of HTML: the copy is written by the
   * desk, not pasted from a developer's brochure, and keeping it as data means
   * it can be translated, excerpted and searched without parsing markup.
   */
  description: string[];
  descriptionBn: string[];

  badge?: PropertyBadge;
  /** Carries the listing onto the home page. Not the same as `badge`. */
  featured: boolean;

  agent?: Types.ObjectId;
  /** Set when the unit belongs to a development the agency also lists. */
  project?: Types.ObjectId;

  /** When it went on the market. Set the first time it becomes `available`. */
  publishedAt?: Date;
  /**
   * When the mandate runs out.
   *
   * The hourly sweep archives anything past it, because a listing nobody has
   * looked at since March is worse than no listing: it takes the call, wastes
   * the viewing, and the buyer finds out at the door.
   */
  expiresAt?: Date;

  views: number;

  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A managed option list — amenities today, anything else the desk needs to keep
 * consistent tomorrow. Same shape as the lists behind areas and projects, so
 * one factory builds them all and one screen edits them.
 */
export interface IOptionList extends Document {
  name: string;
  nameBn?: string;
  description?: string;
  /** Lucide icon name, so the site can draw it without a lookup table. */
  icon?: string;
  order: number;
  isActive: boolean;
}

export type IPropertyAmenity = IOptionList;
