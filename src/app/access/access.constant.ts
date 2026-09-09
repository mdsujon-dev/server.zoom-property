import { UserRole } from "../modules/auth/auth.interface";

/**
 * The role that is not a staff role (empty now that agents are removed).
 */
export const PERSONA_ROLES = [] as const;

export type PersonaRole = (typeof PERSONA_ROLES)[number];

/** Which of the two panels a signed-in account belongs to. */
export type Persona = "employee";

const normalise = (role?: string | null) => String(role ?? "").toUpperCase();

/** True when this role name is one of the fixed personas. */
export const isPersonaRole = (role?: string | null): role is PersonaRole => false;

/** Which panel a role name lands in. Everything not a persona is staff. */
export const personaOf = (role?: string | null): Persona => "employee";

/* ── Designations ─────────────────────────────────────────────────────────── */
export const DESIGNATION_SCOPES = ["employee"] as const;

export type DesignationScope = (typeof DESIGNATION_SCOPES)[number];

/** Scopes an admin may pick from. */
export const SELECTABLE_DESIGNATION_SCOPES: DesignationScope[] = [
  "employee",
];

export const AGENT_DESIGNATION_SEED: any[] = [];
