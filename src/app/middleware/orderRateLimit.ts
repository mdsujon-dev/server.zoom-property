import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/appError";
import catchAsync from "../utils/catchAsync";
import {
  memExpire,
  memGet,
  memIncr,
  memSet,
  memTtl,
} from "../shared/memoryStore";

// Best-effort lead IP — honours the first X-Forwarded-For entry (proxy),
// falling back to the socket address.
export const getLeadIp = (req: Request): string => {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
};

// Anti-spam guard for guest order placement: no more than MAX_PER_WINDOW
// requests from one IP per WINDOW_SECONDS. Exceeding it blocks that IP for
// BLOCK_SECONDS so it can't hammer the endpoint with fake orders.
const WINDOW_SECONDS = 60; // 1 minute
const MAX_PER_WINDOW = 5; // 5 requests / minute
const BLOCK_SECONDS = 60 * 60; // blocked for 1 hour

export const orderRateLimit = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const ip = getLeadIp(req);
    const blockKey = `order:block:${ip}`;
    const countKey = `order:rate:${ip}`;

    // Already blocked?
    const blocked = memGet(blockKey);
    if (blocked) {
      const ttl = memTtl(blockKey);
      const minutes = Math.max(1, Math.ceil(ttl / 60));
      throw new AppError(
        StatusCodes.TOO_MANY_REQUESTS,
        `Too many orders from your network. Please try again in about ${minutes} minute(s).`
      );
    }

    // Count this request within the rolling window.
    const count = memIncr(countKey);
    if (count === 1) {
      memExpire(countKey, WINDOW_SECONDS);
    }

    if (count > MAX_PER_WINDOW) {
      // Trip the block and reject.
      memSet(blockKey, "1", BLOCK_SECONDS);
      throw new AppError(
        StatusCodes.TOO_MANY_REQUESTS,
        "Too many orders from your network. You've been temporarily blocked for 1 hour."
      );
    }

    next();
  }
);
