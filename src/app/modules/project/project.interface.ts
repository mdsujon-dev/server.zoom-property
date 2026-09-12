import { Document, Types } from "mongoose";

/**
 * Where a development is in its build.
 *
 * Three words rather than a percentage, because a percentage alone tells a
 * buyer nothing they can picture. `progress` carries the number beside it.
 *
 * The list lives here, not in the model, so the schema and the request
 * validator can share one vocabulary instead of drifting apart.
 */
export const PROJECT_STAGES = ["Planning", "Processing", "Completed"] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

/**
 * One line of the build programme.
 *
 * `percent` is that milestone's share of the whole build, not its own
 * completion — the sum across milestones is what `progress` reports, so a
 * project cannot claim 60% while its milestones add to 40.
 */
export interface IMilestone {
  label: string;
  labelBn?: string;
  percent: number;
  completed: boolean;
}

/**
 * An under-construction development.
 *
 * The point of this record is transparency: the milestone breakdown, the date
 * somebody last walked the site, and the permit number are what separate a
 * project page from a brochure. Every one of them is a field the desk has to
 * fill in and can be held to.
 */
export interface IProject extends Document {
  name: string;
  nameBn?: string;
  /** URL segment for `/projects/[slug]`. */
  slug: string;
  developer?: string;

  area: Types.ObjectId;
  city: string;

  /** Completion, 0–100. Derived from `milestones` on every save. */
  progress: number;
  stage: ProjectStage;
  /** Free text: "Q4 2027". Not a date — most of them are a quarter. */
  handover?: string;

  units: number;
  unitsLeft: number;
  /** "1,450 – 2,300 sq ft", as written. */
  sizeRange?: string;
  startingPrice?: number;

  coverImage?: Types.ObjectId;
  images: Types.ObjectId[];

  description: string[];
  descriptionBn: string[];

  /**
   * The site walkthrough. Filmed on the visit that produced `lastInspected`, so
   * the footage and the percentages above it describe the same day.
   */
  video?: {
    title?: string;
    titleBn?: string;
    youtubeUrl?: string;
    poster?: Types.ObjectId;
    duration?: string;
  };

  /** The day somebody from the agency last walked the site. */
  lastInspected?: Date;
  cctvStreamActive: boolean;
  rajukPermitNo?: string;

  milestones: IMilestone[];
  mapUrl?: string;

  featured: boolean;
  order?: number;
  /**
   * Picked for the home page.
   *
   * A deliberate choice by the desk rather than a side effect of ordering
   * or of `featured`: the home page shows a handful, and which handful is
   * an editorial decision that should survive someone reordering the list.
   */
  isHome: boolean;
  /** Picked for the compact project list in the site footer. */
  isFooter: boolean;
  isActive: boolean;
  isDeleted: boolean;
  agent?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
