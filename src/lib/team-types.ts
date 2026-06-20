export type TeamMember = {
  id: string; name: string; role: string; email: string; phone: string; avatarUrl: string;
  status: "active" | "on_leave"; projectIds: string[]; managerId?: string;
};
