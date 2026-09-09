import { CorsOptions } from "cors";
import config from "../config";

/**
 * The HTTP API and Socket.IO share one allow-list (CORS_ORIGIN), so a new
 * deployment origin is only ever added in one place.
 *
 * This is a matcher rather than the plain array `cors` would happily accept,
 * because the two things that actually break a deployment are not spelling
 * mistakes — they are shape mismatches the eye slides straight over:
 *
 *  - A pasted origin carrying a trailing slash ("https://admin.example.com/")
 *    is never equal to what the browser sends, which has no path at all.
 *  - A Vercel or Netlify preview build gets a brand-new hostname on every
 *    push, so no fixed list can contain the URL the tester is looking at.
 *
 * Both sides are therefore normalised, and a list entry may use `*` in place
 * of one hostname label: "https://*.vercel.app".
 */

const normalise = (origin: string) =>
  origin.trim().replace(/\/+$/, "").toLowerCase();

/** A literal "*" in the list means "reflect back whichever origin asks". */
export const allowAnyOrigin = config.cors_origin.includes("*");

const matchers = config.cors_origin
  .filter((allowed) => allowed !== "*")
  .map((allowed) => {
    const value = normalise(allowed);
    if (!value.includes("*")) return (origin: string) => origin === value;

    // Everything regex-significant is escaped first, so only the `*` that was
    // written on purpose keeps any meaning — and it stands for a single label,
    // not for dots, so "https://*.vercel.app" cannot be satisfied by
    // "https://anything.evil.com/x.vercel.app".
    const pattern = new RegExp(
      `^${value.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+")}$`
    );
    return (origin: string) => pattern.test(origin);
  });

export const isAllowedOrigin = (origin: string) =>
  matchers.some((matches) => matches(normalise(origin)));

export const corsOptions: CorsOptions = {
  origin: allowAnyOrigin
    ? true
    : (origin, callback) => {
        // No Origin header at all: curl, uptime checks, server-to-server.
        // Nothing to protect — CORS exists only to police browsers.
        if (!origin) return callback(null, true);
        if (isAllowedOrigin(origin)) return callback(null, true);

        // A browser only ever reports "blocked by CORS" and never says which
        // origin it was. Without this line the deploy log stays silent about
        // the single fact needed to fix the problem.
        console.warn(`[cors] blocked origin: ${origin}`);
        return callback(null, false);
      },
  credentials: true,
};

/**
 * Printed at boot so a CORS failure can be diagnosed from the deploy log alone,
 * without shell access to the container.
 */
export const logCorsPolicy = () => {
  if (allowAnyOrigin) {
    console.warn(
      '🌐 CORS: every origin allowed — CORS_ORIGIN contains "*". Fine for a ' +
        "staging box, too open for production."
    );
    return;
  }

  console.log(`🌐 CORS allow-list: ${config.cors_origin.join(", ")}`);

  // The quiet killer: the variable never arrives in the container, dotenv
  // finds no .env.production to read, and the app falls back to localhost —
  // which looks like a working boot right up until a browser calls it.
  if (config.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
    console.warn(
      "⚠️  CORS_ORIGIN is not set in this environment — the list above is the " +
        "built-in localhost fallback, so every browser request from the real " +
        "frontend will be blocked. Set it on the deployment platform."
    );
  }
};
