export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";
export type Project = {
  id: string; name: string; client: string; location: string; status: ProjectStatus;
  progress: number; startDate: string; endDate: string;
  managerId: string; teamIds: string[]; color: string; description: string;
};
