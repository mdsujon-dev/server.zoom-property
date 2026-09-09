import { Types } from "mongoose";
import User from "../auth/auth.model";
import { IRecordChange, RecordHistory, HistoryAction } from "./history.model";

/**
 * Fields nobody wants to read about. `updatedAt` changes on every save, and a
 * history whose every entry says "updatedAt changed" buries the one entry that
 * mattered.
 */
const IGNORED = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "updatedBy",
  "createdBy",
  "isDeleted",
]);

/** Dates, ObjectIds and numbers all have to compare as what they read as. */
const normalise = (value: unknown): unknown => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return String(value);
  if (Array.isArray(value)) return value.map(normalise);
  return value;
};

const same = (a: unknown, b: unknown) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

/**
 * The fields that actually changed between two versions of a document.
 *
 * Only keys present in the payload are compared: a form that posts ten fields
 * of which one differs should produce one line of history, not ten "unchanged"
 * ones, and certainly not entries for the fields it never sent.
 */
export const diffFields = (
  before: Record<string, any>,
  payload: Record<string, any>
): IRecordChange[] => {
  const changes: IRecordChange[] = [];
  for (const [field, to] of Object.entries(payload)) {
    if (IGNORED.has(field) || to === undefined) continue;
    const from = before?.[field];
    if (same(from, to)) continue;
    changes.push({ field, from: normalise(from), to: normalise(to) });
  }
  return changes;
};

/**
 * Write one history entry. Never throws: an audit trail that can fail a save is
 * worse than one that occasionally misses a line — the office would lose the
 * edit itself, not just the note about it.
 */
export const recordHistory = async (input: {
  entity: string;
  entityId: string | Types.ObjectId;
  action: HistoryAction;
  changes?: IRecordChange[];
  meta?: unknown;
  by?: string;
}) => {
  try {
    if (input.action === "updated" && !input.changes?.length) return;

    let byName: string | undefined;
    if (input.by) {
      const user = await User.findById(input.by).select("name");
      byName = user?.name;
    }

    await RecordHistory.create({
      entity: input.entity,
      entityId: new Types.ObjectId(String(input.entityId)),
      action: input.action,
      changes: input.changes ?? [],
      meta: input.meta,
      by: input.by ? new Types.ObjectId(input.by) : undefined,
      byName,
      at: new Date(),
    });
  } catch {
    // Swallowed on purpose — see above.
  }
};

/** Newest first: the last thing that happened is what people look for. */
export const getHistory = async (entity: string, entityId: string) =>
  RecordHistory.find({ entity, entityId: new Types.ObjectId(entityId) })
    .sort({ at: -1 })
    .limit(200)
    .lean();

export const HistoryService = { recordHistory, diffFields, getHistory };
