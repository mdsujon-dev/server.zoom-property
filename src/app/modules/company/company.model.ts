import { Schema, model } from "mongoose";

/**
 * The agency's own details — name, logo, contact, and the lines that go on a
 * receipt or a staff ID card.
 *
 * One document, always. Every screen that needs "who are we" — the ID card, the
 * money receipt, the report letterhead — reads the same row, so changing the
 * phone number in one place changes it everywhere rather than leaving three
 * copies to drift apart. `getSettings()` creates it on first read, so the panel
 * never has to cope with "not configured yet".
 */
export interface ICompany {
  name: string;
  shortName?: string;
  tagline?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  /** The trading licence / BIN printed on invoices. */
  licenceNo?: string;
  /** Printed under the total on a receipt. */
  invoicePrefix?: string;
  invoiceFooter?: string;
  /** Printed at the foot of an exported report. */
  reportFooter?: string;
  /** Shown on an ID card so a found card can be returned. */
  idCardNote?: string;
  /**
   * Which card design each group is printed on.
   *
   * Kept per group rather than one setting for the company: an agent's card is
   * handed to clients and an office card is not, and a firm that wants its
   * agents to stand out at a glance should not have to choose between that and
   * a consistent staff card.
   */
  idCardTemplates?: {
    agent?: string;
    employee?: string;
  };
  /**
   * Per-group tweaks on top of the chosen design — the accent colour, which
   * rows to print, and the terms on the back.
   *
   * Stored as a loose object on purpose: the panel draws the cards, so it owns
   * what is adjustable. Adding a knob should not need a server release, and a
   * knob that is removed simply stops being read.
   */
  idCardOptions?: Record<string, unknown>;
  updatedBy?: Schema.Types.ObjectId;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true, default: "Zoom Property" },
    shortName: { type: String, trim: true },
    tagline: { type: String, trim: true },
    // A URL rather than an upload ref: the media library already stores the
    // file and hands back a URL, and an ID card only ever needs the address.
    logo: { type: String, trim: true },

    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    address: { type: String, trim: true },
    licenceNo: { type: String, trim: true },

    invoicePrefix: { type: String, trim: true, default: "INV" },
    invoiceFooter: { type: String, trim: true },
    reportFooter: { type: String, trim: true },

    idCardNote: { type: String, trim: true },
    // Two different cards by default, so an agent's is recognisable across a
    // room from an office one. The panel owns the design names; these are only
    // the starting points and are overridden from Settings → ID Cards.
    idCardTemplates: {
      agent: { type: String, default: "sidebar" },
      employee: { type: String, default: "midnight" },
    },
    idCardOptions: { type: Schema.Types.Mixed, default: {} },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Company = model<ICompany>("Company", companySchema);
