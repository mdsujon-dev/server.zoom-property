import { AGENT_DESIGNATION_SEED } from "../access";
import { Designation } from "../modules/designation/designation.model";

/**
 * The designations the app needs to exist before anyone uses it.
 *
 * They are a starting vocabulary: without them the agent form opens with an
 * empty dropdown on day one, and whoever is registering the first agent invents
 * a designation under time pressure. They are ordinary rows once created —
 * rename, deactivate or add from Settings → Designations.
 *
 * Idempotent, so it can run on every boot: an existing row is only touched to
 * backfill the `scope` it predates.
 */
const seedDesignations = async () => {
  for (const entry of AGENT_DESIGNATION_SEED) {
    const existing = await Designation.findOne({ name: entry.name });
    if (!existing) {
      await Designation.create({ ...entry, scope: "agent", is_active: true });
      continue;
    }
    // A designation created by hand before scopes existed would otherwise stay
    // in the employee list and never reach the agent form.
    if (!existing.scope) {
      await Designation.updateOne({ _id: existing._id }, { scope: "agent" });
    }
  }
};

export default seedDesignations;
