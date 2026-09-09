import { UserRole } from "../modules/auth/auth.interface";
import { Role } from "../modules/role/role.model";

/**
 * The roles the app itself hands out.
 *
 * Every account issued from a profile form needs a role to exist before it can
 * be created, and expecting someone to invent one on their first day is how an
 * agent ends up as an ADMIN. It is seeded empty of permissions on purpose: what
 * an agent may actually see is fixed in `src/app/access/agentAccess.ts`, not
 * ticked here.
 */
const seedRole = async () => {
  try {

    const existing = await Role.findOne({ role: UserRole.SUPER_ADMIN });
    if (existing) {
      console.log("SUPER_ADMIN role already exists.");
      return existing;
    }

    const created = await Role.create({
      role: UserRole.SUPER_ADMIN,
      description: "System super admin with unrestricted access",
      isActive: true,
    });
    console.log("SUPER_ADMIN role created successfully.");
    return created;
  } catch (error) {
    console.error("Error seeding roles:", error);
    throw error;
  }
};

export default seedRole;
