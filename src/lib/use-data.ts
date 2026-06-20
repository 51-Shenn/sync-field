"use client";

import { useCallback } from "react";
import { useOperations } from "@/components/operations-provider";
import type { SiteReport } from "@/lib/report-types";
import type { TeamMember } from "@/lib/team-types";
import type { Project } from "@/lib/project-types";

export function useProjects(): { projects: Project[]; loading: boolean } {
  const { snapshot, isInitializing } = useOperations();
  const projects: Project[] = snapshot.projects.map((p) => ({
    id: p.id, name: p.name, client: p.client, location: p.location, status: p.status,
    progress: p.progress, startDate: p.startDate, endDate: p.endDate,
    managerId: p.managerId, teamIds: [], color: p.color, description: p.description,
  }));
  return { projects, loading: isInitializing };
}

export function useTeamMembers() {
  const { snapshot, isInitializing, createTechnician, updateTechnician, deleteTechnician } = useOperations();
  const teamMembers: TeamMember[] = snapshot.technicians.map((t) => ({
    id: t.id, name: t.name, role: t.role, email: t.email, phone: t.phone,
    avatarUrl: "", status: t.status === "active" ? "active" : "on_leave",
    projectIds: t.projectIds, managerId: t.managerId ?? undefined,
  }));
  // Normalize managerId to null so JSON.stringify keeps it (undefined is dropped),
  // letting the API clear a worker's manager when "No manager" is selected.
  const createWorker = (input: Omit<TeamMember, "id">) =>
    createTechnician({ ...input, managerId: input.managerId ?? null });
  const updateWorker = (id: string, input: Omit<TeamMember, "id">) =>
    updateTechnician(id, { ...input, managerId: input.managerId ?? null });
  const deleteWorker = (id: string) => deleteTechnician(id);
  return { teamMembers, loading: isInitializing, createWorker, updateWorker, deleteWorker };
}

export function useDocuments() {
  const { snapshot, isInitializing } = useOperations();
  return { documents: snapshot.documents, loading: isInitializing };
}

export function useSiteReports() {
  const { snapshot, isInitializing, refresh } = useOperations();
  const createReport = useCallback(async (input: Omit<SiteReport, "id" | "createdAt">) => {
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to create report");
    await refresh();
  }, [refresh]);
  const updateReport = useCallback(async (id: string, input: Partial<SiteReport>) => {
    const res = await fetch(`/api/reports/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to update report");
    await refresh();
  }, [refresh]);
  const deleteReport = useCallback(async (id: string) => {
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete report");
    await refresh();
  }, [refresh]);
  return { reports: snapshot.reports, loading: isInitializing, createReport, updateReport, deleteReport };
}

export function useAuditLogs() {
  const { snapshot, isInitializing } = useOperations();
  return { auditLogs: snapshot.auditLogs, loading: isInitializing };
}

export function useActivities() {
  return { activities: [], loading: false };
}
