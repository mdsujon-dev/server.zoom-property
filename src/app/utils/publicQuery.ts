/**
 * Narrows a query string down to what a public caller is allowed to ask.
 *
 * The list endpoints hand everything left in the query to `QueryBuilder`,
 * which passes it to Mongo as a filter. That is fine behind `auth()`. In front
 * of a public route it is not: a controller that sets `status: "available"`
 * and then lets the caller send `?status=draft` has its safety filter
 * overwritten by the very request it was meant to constrain — `find()` merges
 * conditions, and the last writer of a key wins.
 *
 * So a public route states what may be filtered on rather than what may not.
 * A whitelist fails closed: a field added to a model later is not filterable
 * from the website until somebody decides it should be.
 *
 * `page`, `limit`, `sort`, `fields` and `searchTerm` are always allowed —
 * paging and sorting reveal nothing the rows do not.
 */
const ALWAYS = ["page", "limit", "sort", "fields", "searchTerm", "q"] as const;

export const publicQuery = (
  query: Record<string, unknown>,
  allowed: readonly string[]
): Record<string, unknown> => {
  const permitted = new Set<string>([...ALWAYS, ...allowed]);
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query ?? {})) {
    if (!permitted.has(key)) continue;
    if (value === undefined || value === "") continue;
    out[key] = value;
  }

  return out;
};

export default publicQuery;
