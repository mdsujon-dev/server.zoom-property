import { Schema, model } from "mongoose";

/**
 * Atomic sequence counters, one document per series.
 *
 * Human-readable reference numbers (ZP-2026-0107, EMP-2026-001, voucher
 * numbers) have to be gapless and unique under concurrent writes, which rules
 * out counting existing rows. Each series keeps its own row — `_id` is the
 * series name, e.g. "property-2026" — and `findOneAndUpdate` with `$inc` hands
 * out the next value in a single atomic operation.
 *
 * It lived inside the student module before, which made every other module
 * that needed a reference number import from a domain it had nothing to do
 * with. It is infrastructure, so it lives here.
 */
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = model("Counter", counterSchema);

/**
 * The next number in a series, as a zero-padded string.
 *
 *     await nextSequence("property-2026", 4)  // "0007"
 */
export const nextSequence = async (series: string, pad = 4) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: series },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return String(counter?.seq ?? 1).padStart(pad, "0");
};
