import { corsOptions } from "../utils/cors";

// Socket.IO shares the HTTP API's allow-list and matching rules, so a new
// deployment origin only ever has to be added in one place — and a wildcard
// or trailing-slash entry behaves identically on both.
export const socketCorsOptions = corsOptions;
