export type AppMode = "demo" | "production";

export type SystemAccessRole = "master" | "division" | "manager" | "teacher" | "staff";

export type SessionIdentity = {
  userId: string;
  staffId: string;
  email: string;
  name: string;
  position: string;
  division: string;
  department: string;
  systemRole: SystemAccessRole;
  isSystemAdmin: boolean;
  mustChangePassword: boolean;
};

export type SessionResponse = {
  mode: AppMode;
  user: SessionIdentity | null;
};
