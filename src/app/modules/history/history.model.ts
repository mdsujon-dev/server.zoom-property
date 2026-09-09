import { Schema, model, Types } from "mongoose";

/**
 * Who changed what, and to what (FR-2.6, "তথ্য পরিবর্তনের ইতিহাস").
 *
 * Not the same thing as the action log, which records HTTP requests and is
 * deleted after thirty days: this is the record's own history. "Someone PATCHed
 * /students/abc last March" does not answer "why does this student's fee say
 * 12,000 when we agreed 15,000" — that needs the field, the old value, the new
 * one and the person, kept for as long as the record itself is kept. So there
 * is deliberately no TTL index here.
 */
export interface IRecordChange {
  field: string;
  from: unknown;
  to: unknown;
}

export type HistoryAction =
  | "created"
  | "updated"
  /** A soft delete. The record stays; it stops being live. */
  | "archived"
  | "restored"
  | "published"
  | "status-changed"
  | "assigned";

export interface IRecordHistory {
  entity: string;
  entityId: Types.ObjectId;
  action: HistoryAction;
  changes: IRecordChange[];
  meta?: unknown; // Additional information for activity logs
  by?: Types.ObjectId;
  byName?: string;
  at: Date;
}

const changeSchema = new Schema<IRecordChange>(
  {
    field: { type: String, required: true },
    from: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const historySchema = new Schema<IRecordHistory>({
  // Stored as a name rather than a ref so one collection serves every module —
  // students today, batches and trainers tomorrow, without a schema change.
  entity: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  action: {
    type: String,
    enum: ["created", "updated", "archived", "restored", "enrolled", "payment", "exam", "assigned"],
    required: true,
  },
  changes: { type: [changeSchema], default: [] },
  meta: { type: Schema.Types.Mixed },
  by: { type: Schema.Types.ObjectId, ref: "User" },
  // Denormalised: the person who made the change may later be archived, and a
  // history that reads "changed by (deleted user)" answers nothing.
  byName: { type: String },
  at: { type: Date, default: Date.now, index: true },
});

historySchema.index({ entity: 1, entityId: 1, at: -1 });

export const RecordHistory = model<IRecordHistory>(
  "RecordHistory",
  historySchema
);
