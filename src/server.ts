import cron from "node-cron";
import { createServer, Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import seedAdmin from "./app/db/seed";
import { CompanyDashboardService } from "./app/modules/dashboard/company.service";
import { EmployeeService } from "./app/modules/employee/employee.service";
import { PropertyService } from "./app/modules/property/property.service";
import { initSocket } from "./app/socket";
import { logCorsPolicy } from "./app/utils/cors";


let server: Server | null = null;

// Database connection
async function connectToDatabase() {
  try {
    await mongoose.connect(config.db_url as string);
    console.log("🛢 Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}


// Graceful shutdown=================================================
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Application bootstrap
async function bootstrap() {
  try {
    await connectToDatabase();
    await seedAdmin();
    await EmployeeService.backfillProfiles();
    // Without this the sidebar entry is filtered out for every role, and the
    // permission screen has no "Properties" module to tick — a dashboard card
    // gated on a module nobody can tick is a card only the super admin sees.
    await CompanyDashboardService.seedPermissionModules();

    server = createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(
        `🚀 Application is running on port http://localhost:${config.port}`
      );
      // Which origins this instance will actually answer — the one thing a
      // browser's "blocked by CORS" message refuses to tell you.
      logCorsPolicy();

      /**
       * A listing that has been sitting on the market past its expiry date is
       * still shown as available until something says otherwise, so the sweep
       * runs hourly rather than at boot — a server that stays up for a month
       * would otherwise never retire anything.
       */
      cron.schedule("5 * * * *", async () => {
        try {
          const { expired } = await PropertyService.expireStaleListings();
          if (expired) console.log(`🏠 Listings expired: ${expired}`);
        } catch (err) {
          console.error("Hourly listing sweep failed:", err);
        }
      });
      // Storefront on-demand revalidation config — so a missing env is obvious
      // in the deploy logs instead of silently failing on the next listing edit.
      if (process.env.FRONTEND_URL && process.env.REVALIDATE_SECRET) {
        console.log(
          `🔄 Frontend revalidation ON → ${process.env.FRONTEND_URL}`
        );
      } else {
        console.warn(
          "⚠️  Frontend revalidation OFF — set FRONTEND_URL and REVALIDATE_SECRET (listing edits won't refresh the site immediately)"
        );
      }
    });

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Error handling
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    console.error("Error during bootstrap:", error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
