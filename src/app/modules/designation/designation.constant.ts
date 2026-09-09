// The designation auto-assigned to the SUPER_ADMIN on seed. It's intentionally
// hidden from the "get all designations" list so admins can't see/assign it —
// it exists only to keep the super admin's designation in sync.
export const SUPER_ADMIN_DESIGNATION = "Super Admin";

// Default phone auto-set on the seeded super admin when ADMIN_PHONE isn't
// provided via env.
export const DEFAULT_ADMIN_PHONE = "+880000000000";
