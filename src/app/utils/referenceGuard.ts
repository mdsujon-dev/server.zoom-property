import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import AppError from "../errors/appError";

/**
 * Refuses to delete a record that something else still points at.
 *
 * Mongo has no foreign keys, so nothing stops a row being removed while other
 * collections still name it. What is left behind is not an error anywhere — it
 * is a field that resolves to nothing, which reads as blank. A trainer's
 * designation goes empty, an employee's role disappears and with it every
 * permission they had, and no screen can say why, because as far as the data is
 * concerned there was never anything there.
 *
 * ── Where the relations come from ──────────────────────────────────────────
 *
 * Not a hand-kept list. Every relation in this codebase is already declared —
 * `{ type: ObjectId, ref: "Course" }` — so the graph is read back out of the
 * schemas themselves. A model added tomorrow with a `ref` is protected the day
 * it is written, with nothing to remember to update here. That is the part
 * worth copying from Prisma: the schema is the single statement of what points
 * at what, and the guard is derived from it rather than maintained beside it.
 *
 * ── What it deliberately ignores ───────────────────────────────────────────
 *
 * Audit fields. `createdBy`, `updatedBy` and their kin point at whoever touched
 * a record, and everybody has touched something — counting those, no account
 * could ever be removed, which is not integrity but paralysis. Prisma would
 * call these `onDelete: SetNull`; here they are simply not asked about.
 *
 * ── What it does not replace ───────────────────────────────────────────────
 *
 * The soft deletes. Most of this app archives rather than removes: the row
 * stays, so every reference still resolves and nothing is dangling. Those
 * screens guard on something narrower and more useful — whether the thing is
 * *in use right now*, which is a question about batches running and students
 * enrolled, not about references existing. See `deleteCourse` and `deleteBatch`.
 */

/** A field in one model that points at another. */
interface Referrer {
  model: string;
  path: string;
}

/**
 * Who touched a record, rather than what it is part of.
 *
 * Matched on the field name, because that is what these are called throughout —
 * and because the alternative, listing every audit field of every model, is the
 * hand-kept list this whole file exists to avoid.
 */
const AUDIT_FIELDS = new Set([
  "createdBy",
  "updatedBy",
  "deletedBy",
  "addedBy",
  "uploadedBy",
  "requestedBy",
  "reviewedBy",
  "processedBy",
  "approvedBy",
  "issuedBy",
  "markedBy",
  "changedBy",
  "performedBy",
  "user_id",
  "userId",
]);

/** Built once, on first use — later than import time, so every model is registered. */
let graph: Map<string, Referrer[]> | null = null;

const buildGraph = () => {
  const built = new Map<string, Referrer[]>();

  for (const modelName of mongoose.modelNames()) {
    const schema = mongoose.model(modelName).schema;

    schema.eachPath((path, type: unknown) => {
      const t = type as {
        options?: { ref?: string };
        caster?: { options?: { ref?: string } };
      };
      // The second form is an array of references: `[{ type: ObjectId, ref }]`.
      const ref = t?.options?.ref ?? t?.caster?.options?.ref;
      if (!ref) return;

      const field = path.split(".").pop() ?? path;
      if (AUDIT_FIELDS.has(field)) return;

      const list = built.get(ref) ?? [];
      list.push({ model: modelName, path });
      built.set(ref, list);
    });
  }

  return built;
};

/** "StaffAttendance" → "staff attendance", so a message reads like a sentence. */
const readable = (modelName: string) =>
  modelName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();

/**
 * Throws 409 when anything still points at `id`, naming what does.
 *
 * `ignore` drops specific referrers for the rare case where a relation is
 * genuinely severable — pass `"Model.path"` entries.
 */
export const assertNotReferenced = async (
  modelName: string,
  id: string,
  options: { ignore?: string[] } = {},
) => {
  if (!graph) graph = buildGraph();

  const ignore = new Set(options.ignore ?? []);
  const referrers = (graph.get(modelName) ?? []).filter(
    (r) => !ignore.has(`${r.model}.${r.path}`),
  );

  /*
   * Counted per referrer rather than as one aggregate, because the message is
   * the point: "still referenced" tells somebody they cannot proceed, and
   * "2 enrolments, 1 batch" tells them what to go and change.
   */
  const blocking: string[] = [];

  for (const { model, path } of referrers) {
    const Model = mongoose.model(model);

    // An archived row is not a live reference — it is already out of the way.
    const filter: Record<string, unknown> = { [path]: id };
    if (Model.schema.path("isDeleted")) filter.isDeleted = { $ne: true };

    const count = await Model.countDocuments(filter);
    if (count > 0) blocking.push(`${count} ${readable(model)}`);
  }

  if (blocking.length > 0) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `Still in use by ${blocking.join(", ")}. Change or remove those first.`,
    );
  }
};

export default assertNotReferenced;
