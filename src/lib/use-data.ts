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

export function useTeamMembers(): { teamMembers: TeamMember[]; loading: boolean } {
  const { snapshot, loading } = useOperations();
  const teamMembers: TeamMember[] = snapshot.technicians.map((t) => ({
    id: t.id, name: t.name, role: t.role, email: "", phone: t.phone,
    avatarUrl: "", status: t.status === "active" ? "active" : "on_leave",
    projectIds: [], managerId: undefined,
  }));
  return { teamMembers, loading };
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
  const refresh = useCallback(async () => {
    const data = await fetchJson("/api/reports");
    setReports(data);
  }, []);
  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);
  const createReport = useCallback(async (input: Omit<SiteReport, "id" | "createdAt">) => {
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("Failed to create report");
    const created = await res.json();
    setReports((prev) => [created, ...prev]);
  }, []);
  return { reports, loading, createReport };
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
