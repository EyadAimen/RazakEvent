export type UserRole = "student" | "member" | "lead" | "admin" | string;

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  staffOrMatricId: string;
  role: UserRole;
}