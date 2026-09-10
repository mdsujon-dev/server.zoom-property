/**
 * Tells the website that something it has cached is now out of date.
 *
 * The site serves pre-built HTML — a visitor waits for no API call — and the
 * price of that is staleness. This is what removes it: after a save, the
 * affected pages are dropped from the site's cache and the next visitor gets
 * fresh HTML. Without this ping a published listing would sit invisible until
 * the backstop window expired.
 *
 * A *tag* rather than a URL, because one record shows up in many places. A
 * project appears on the home page, the projects index, its own page and the
 * footer; naming that list here would be wrong the first time somebody adds a
 * section. The site tags its reads by feature and drops them by feature.
 *
 * Awaited, with a short timeout, so it still fires on a serverless host that
 * would otherwise tear the process down before a fire-and-forget request left.
 * Never throws: revalidation must not break the save that triggered it.
 *
 * Requires FRONTEND_URL and REVALIDATE_SECRET (matching the site's own).
 */

/** The features the website caches by. Must match its `CACHE_TAGS`. */
export type RevalidateTag =
  | "areas"
  | "projects"
  | "properties"
  | "reviews"
  | "insights"
  | "videos"
  | "cms";

export const revalidateFrontend = async (
  tag?: RevalidateTag | RevalidateTag[],
  slug?: string
): Promise<void> => {
  const url = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    // eslint-disable-next-line no-console
    console.warn(
      "[revalidateFrontend] skipped — FRONTEND_URL or REVALIDATE_SECRET not set"
    );
    return;
  }

  try {
    const params = new URLSearchParams({ secret });
    // No tag means "something changed and we did not say what", which the site
    // reads as: refresh everything.
    for (const t of tag ? (Array.isArray(tag) ? tag : [tag]) : []) {
      params.append("tags", t);
    }
    if (slug) params.set("slug", slug);

    const res = await fetch(`${url.replace(/\/$/, "")}/api/revalidate?${params}`, {
      method: "POST",
      // Do not let a slow or unreachable website hang the save's response.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[revalidateFrontend] site responded ${res.status} — check REVALIDATE_SECRET matches`
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[revalidateFrontend] ping failed:", (err as Error)?.message);
  }
};

export default revalidateFrontend;
