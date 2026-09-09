import { AccessGrant } from "./access.interface";

/**
 * Everything a sales agent may do, fixed in code.
 *
 * The list is deliberately short and read-mostly. An agent's job in this system
 * is to keep their own listings current and to work the enquiries that come to
 * them; nothing here lets them touch money, edit another agent's record, or
 * change anything the office owns.
 *
 * `Properties/create` and `/update` are the writes, and they are still narrowed
 * at the data layer — `property.service` scopes an agent's reads and writes to
 * `{ agent: <their own profile> }`, so an agent with this grant can only touch
 * their own listings.
 *
 * Changing this list changes what every agent in the company can do, which is
 * exactly why it lives in a reviewed file rather than behind a checkbox.
 */
export const AGENT_ACCESS: AccessGrant[] = [
  // Their own listings — the screen an agent opens every day.
  { module: "Properties", actions: ["View", "Create", "Update"] },
  // The developer projects their listings sit inside, read only: a project is
  // the company's record, not an agent's.
  { module: "Projects", actions: ["View"] },
  // Areas exist so a listing can name where it is. Read only, same reason.
  { module: "Areas", actions: ["View"] },
  // The enquiries assigned to them: read them, and record what came of them.
  // Delete stays with the office — a lead an agent lost is not theirs to erase.
  { module: "Contact Messages", actions: ["View", "Update"] },
  { module: "Quotation Requests", actions: ["View", "Update"] },
  // Listing photos. Upload is part of putting a property up; deleting from the
  // shared library is not.
  { module: "Media Library", actions: ["View", "Create"] },
  /**
   * Their own notifications.
   *
   * The panel already lists `/notifications` as a page an agent may open, and
   * every notification endpoint is gated on this module — so without the grant
   * the address was reachable and the page behind it was not, which is the
   * worst of both answers. Read only: `delete` stays with the office, and the
   * endpoints scope rows to the caller regardless.
   */
  { module: "Notifications", actions: ["View"] },
];

/**
 * Sidebar destinations an agent is shown, by URL.
 *
 * Kept alongside the grants rather than derived from them: `Areas/view` grants
 * the dropdown inside the listing form, and that is not the same decision as
 * putting an "Areas" link in their sidebar. The admin panel holds the matching
 * list in `src/access/agentAccess.ts` — the two are mirrors, and the server
 * list is the one that is enforced.
 */
export const AGENT_ROUTES = [
  "/",
  "/properties",
  "/projects",
  "/enquiries/contact-messages",
  "/enquiries/quotation-requests",
  "/media-library",
  "/settings/profile",
  "/user-guide",
];
