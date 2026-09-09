import mongoose from "mongoose";
import config from "../config";
import {
  DEFAULT_ADMIN_PHONE,
  SUPER_ADMIN_DESIGNATION,
} from "../modules/designation/designation.constant";
import { Designation } from "../modules/designation/designation.model";
import { UserRole } from "../modules/auth/auth.interface";
import User from "../modules/auth/auth.model";
import seedDesignations from "./seedDesignations";
import seedRole from "./seedRole";

const adminUserBase = {
  email: config.admin_email as string,
  password: config.admin_password as string,
  name: config.admin_name || "Adminesstation",
  role: UserRole.SUPER_ADMIN,
  phone: config.admin_phone || DEFAULT_ADMIN_PHONE,
  profilePhoto: "",
  loginInfo: {
    device: "Desktop",
    browser: "Chrome",
    ipAddress: "58.145.190.207",
    pcName: "DESKTOP-8G8H8H8",
    os: "Windows 10",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36",
  },
};

/**
 * Find the hidden "Super Admin" designation, creating it on first seed. It's
 * excluded from the designation list (see designation.service) so it stays an
 * internal, system-only designation.
 */
const ensureSuperAdminDesignation = async () => {
  let designation = await Designation.findOne({
    name: SUPER_ADMIN_DESIGNATION,
  });
  if (!designation) {
    designation = await Designation.create({
      name: SUPER_ADMIN_DESIGNATION,
      description: "System designation for the super admin.",
      is_active: true,
    });
  }
  return designation;
};

const seedAdmin = async () => {
  try {
    if (!adminUserBase.email || !adminUserBase.password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the super admin."
      );
    }

    // 1) Ensure the SUPER_ADMIN role + designation exist, capture their ids.
    const superAdminRole = await seedRole();
    const superAdminDesignation = await ensureSuperAdminDesignation();

    // The agent designation vocabulary. Independent of
    // the admin account, but this is the one seed that always runs.
    await seedDesignations();

    // 2) Create the admin user linked to that role + designation (+ phone).
    const isAdminExist = await User.findOne({ email: adminUserBase.email });
    if (!isAdminExist) {
      await User.create({
        ...adminUserBase,
        roleId: superAdminRole?._id,
        designationId: superAdminDesignation?._id,
      });
      console.log("✅ Admin user created successfully.");
    } else {
      // Backfill any missing role / designation / phone on an existing admin.
      // Using updateOne to bypass the password-rehashing pre-save hook.
      const update: Record<string, unknown> = {};
      if (!isAdminExist.roleId && superAdminRole?._id) {
        update.roleId = superAdminRole._id;
        update.role = UserRole.SUPER_ADMIN;
      }
      if (!isAdminExist.designationId && superAdminDesignation?._id) {
        update.designationId = superAdminDesignation._id;
      }
      if (!isAdminExist.phone) {
        update.phone = adminUserBase.phone;
      }
      if (Object.keys(update).length > 0) {
        await User.updateOne({ _id: isAdminExist._id }, update);
        console.log("✅ Admin user synced (role / designation / phone).");
      } else {
        console.log("ℹ️  Admin user already up to date.");
      }
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
};

/**
 * Runnable entry point so `npm run seed:user` actually executes the seed.
 * Connects to MongoDB, runs seedAdmin, then disconnects and exits.
 */
const runSeed = async () => {
  try {
    if (!config.db_url) {
      throw new Error(
        "DB_URL is not set in .env — cannot connect to MongoDB."
      );
    }
    await mongoose.connect(config.db_url as string);
    console.log("🛢  Connected to database");
    await seedAdmin();
    console.log("🌱 Seed complete");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

// Only run when invoked directly (e.g. `ts-node src/app/db/seed.ts`),
// not when this module is imported elsewhere.
if (require.main === module) {
  void runSeed();
}

export default seedAdmin;
