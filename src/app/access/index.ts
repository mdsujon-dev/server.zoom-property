import { AccessGrant } from "./access.interface";
import { Persona, personaOf } from "./access.constant";

export * from "./access.constant";
export * from "./access.interface";
export { resolvePersonaRole } from "./personaRole";

export const getPredefinedAccess = (
  role?: string | null
): AccessGrant[] | null => null;

export const getPredefinedRoutes = (role?: string | null): string[] | null =>
  null;

export const predefinedAccessAllows = (
  role: string | null | undefined,
  module: string,
  action: string
): boolean => {
  return false;
};
