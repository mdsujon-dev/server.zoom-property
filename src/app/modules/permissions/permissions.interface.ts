export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  /**
   * Doing the thing the rules say should not be done — issuing a certificate to
   * a student who did not meet the attendance bar, and nothing else so far.
   *
   * Kept apart from "create" on purpose: the front desk should be able to hand
   * out earned certificates all day without also being able to grant unearned
   * ones. Only modules that declare it will show it.
   */
  "override",
  /**
   * Signing off on something somebody else asked for — a student's fee refund,
   * and nothing else so far.
   *
   * Deliberately not "update": the accounts desk raises the refund request and
   * needs `update` to do the rest of its job, so a request would be approvable
   * by the same person who wrote it. Management approval only means something
   * while it is a grant of its own, held by someone the request has to reach.
   */
  "approve",
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface IPermissions {
  module: string;
  description?: string;
  actions: PermissionAction[];
  is_active?: boolean;
}
