import { UserRole } from "../modules/auth/auth.interface";

export interface AuthedSocketData {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}
