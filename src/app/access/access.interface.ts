/**
 * One module and the actions a persona holds on it.
 *
 * Same shape `/user/me` reports for a staff member's role-based permissions, so
 * the admin panel cannot tell a predefined grant from a granted one and needs no
 * second code path to read it.
 */
export interface AccessGrant {
  module: string;
  actions: string[];
}
