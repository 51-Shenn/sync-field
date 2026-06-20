"use client";

import { useState, useEffect, useCallback } from "react";
import { useOperations } from "@/components/operations-provider";
import type { DocumentFile } from "@/lib/document-types";
import type { SiteReport } from "@/lib/report-types";
import type { AuditLog } from "@/lib/audit-types";
import type { TeamMember } from "@/lib/team-types";
import type { Project } from "@/lib/project-types";

export function useProjects(): { projects: Project[]; loading: boolean } {
  const { snapshot, loading } = useOperations();
  const projects: Project[] = snapshot.projects.map((p) => ({
    id: p.id, name: p.name, client: p.client, location: p.location, status: p.status,
    progress: p.progress, startDate: p.startDate, endDate: p.endDate,
    managerId: p.managerId, teamIds: [], color: p.color, description: p.description,
  }));
  return { projects, loading };
}

export function useTeamMembers() {
  const { snapshot, loading, createTechnician, updateTechnician, deleteTechnician } = useOperations();
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
  return { teamMembers, loading, createWorker, updateWorker, deleteWorker };
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchJson("/api/documents").then(setDocuments).catch(() => {}).finally(() => setLoading(false)); }, []);
  return { documents, loading };
}

export function useSiteReports() {
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchJson("/api/reports").then(setReports).catch(() => {}).finally(() => setLoading(false)); }, []);
  const createReport = useCallback(async (input: Omit<SiteReport, "id" | "createdAt">) => {
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to create report");
    const created = await res.json();
    setReports((prev) => [created, ...prev]);
  }, []);
  const updateReport = useCallback(async (id: string, input: Partial<SiteReport>) => {
    const res = await fetch(`/api/reports/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to update report");
    const updated = await res.json();
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);
  const deleteReport = useCallback(async (id: string) => {
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete report");
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);
  return { reports, loading, createReport, updateReport, deleteReport };
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchJson("/api/audit-logs").then(setAuditLogs).catch(() => {}).finally(() => setLoading(false)); }, []);
  const addLog = useCallback(async (input: Omit<AuditLog, "id">) => {
    const res = await fetch("/api/audit-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to create audit log");
    const created = await res.json();
    setAuditLogs((prev) => [created, ...prev]);
  }, []);
  return { auditLogs, loading, addLog };
}

export function useActivities() {
  const [activities, setActivities] = useState<{ id: string; person: string; action: string; target: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchJson("/api/activities").then(setActivities).catch(() => {}).finally(() => setLoading(false)); }, []);
  return { activities, loading };
}
