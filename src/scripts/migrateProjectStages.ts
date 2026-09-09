import mongoose from "mongoose";

import config from "../app/config";
import { Project } from "../app/modules/project/project.model";

/**
 * Moves existing projects onto the three-stage vocabulary.
 *
 * The stages used to be Piling / Structure / Finishing / Handover ready. Rows
 * written before the change still carry those words, and nothing rewrites them
 * on read — so until this runs, an old project shows a stage the form cannot
 * offer, refuses to save (the schema enum rejects it), and is invisible to the
 * dashboard's completed count.
 *
 * The three construction words all mean the same thing under the new list:
 * work is underway. Only "Handover ready" carries its own meaning across.
 *
 * Safe to run more than once — a row already on a new stage matches nothing.
 *
 *   npm run migrate:project-stages
 */
const STAGE_MAP: Record<string, string> = {
  Piling: "Processing",
  Structure: "Processing",
  Finishing: "Processing",
  "Handover ready": "Completed",
};

const run = async () => {
  if (!config.db_url) {
    throw new Error("DB_URL is not set — nothing to migrate against.");
  }

  await mongoose.connect(config.db_url);
  console.log("🛢  Connected to database");

  let moved = 0;
  for (const [from, to] of Object.entries(STAGE_MAP)) {
    const res = await Project.updateMany({ stage: from }, { $set: { stage: to } });
    if (res.modifiedCount) {
      console.log(`   ${from} → ${to}: ${res.modifiedCount}`);
      moved += res.modifiedCount;
    }
  }

  // Anything else — a blank stage, or a word from some older list — starts at
  // the beginning rather than being guessed at.
  const stranded = await Project.updateMany(
    { stage: { $nin: ["Planning", "Processing", "Completed"] } },
    { $set: { stage: "Planning" } }
  );
  if (stranded.modifiedCount) {
    console.log(`   unrecognised → Planning: ${stranded.modifiedCount}`);
    moved += stranded.modifiedCount;
  }

  console.log(moved ? `✅ ${moved} project(s) updated` : "✅ Nothing to update");
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
