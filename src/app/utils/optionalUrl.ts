import { z } from "zod";

/**
 * Pulls the address out of an embed snippet.
 *
 * Tour and video providers hand out an `<iframe …>` block rather than a bare
 * link, so that is what ends up pasted into the form. Take the `src` when we
 * are clearly looking at markup instead of rejecting the whole thing.
 */
const srcFromEmbed = (val: string) => {
  if (!val.includes("<")) return val;
  const match = val.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
  return match ? match[1].trim() : val;
};

const isHostLike = (url: URL) =>
  url.hostname === "localhost" ||
  /^[^.]+(\.[^.]+)+$/.test(url.hostname.replace(/\.$/, ""));

/**
 * An optional http(s) address. Blank, `null` and whitespace all come back as
 * `undefined`; a bare `example.com` gains an `https://`; an embed snippet is
 * reduced to its `src`. Anything left that isn't a real host is rejected, so a
 * stray word can't be stored as `https://<word>`.
 */
export const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return undefined;
    const candidate = srcFromEmbed(val).trim();
    // A scheme on its own is the same as leaving the field empty.
    if (!candidate || /^https?:\/\/$/i.test(candidate)) return undefined;
    return /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
  })
  .refine(
    (val) => {
      if (!val) return true;
      try {
        return isHostLike(new URL(val));
      } catch {
        return false;
      }
    },
    { message: "Enter a valid URL, for example https://example.com/tour" }
  );

export default optionalUrl;
