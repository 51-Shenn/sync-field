"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { OperationsCommandInput, OperationsSnapshot } from "@/lib/operations-types";

type OperationsContextValue = {
  snapshot: OperationsSnapshot;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  issueCommand: (command: OperationsCommandInput) => Promise<string>;
  createProject: (project: Record<string, unknown>) => Promise<void>;
  updateProject: (id: string, project: Record<string, unknown>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createSubtask: (subtask: Record<string, unknown>) => Promise<void>;
  updateSubtask: (id: string, subtask: Record<string, unknown>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  createTechnician: (technician: Record<string, unknown>) => Promise<void>;
  updateTechnician: (id: string, technician: Record<string, unknown>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
};

const emptySnapshot: OperationsSnapshot = {
  projects: [], tasks: [], subtasks: [], technicians: [], taskEvents: [], alerts: [], processedMessages: [], commands: [],
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  return data;
}

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await requestJson("/api/operations/snapshot", { cache: "no-store" }) as OperationsSnapshot;
      setSnapshot(next);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load operations");
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refresh(), 120);
  }, [refresh]);

  useEffect(() => {
    const initialRefresh = setTimeout(() => void refresh(), 0);
    const pollingFallback = setInterval(() => void refresh(), 10_000);
    const sb = getSupabaseBrowser();
    if (!sb) return () => { clearTimeout(initialRefresh); clearInterval(pollingFallback); };
    const channel = sb.channel("syncfield-operations");
    for (const table of ["projects", "tasks", "subtasks", "technicians", "task_events", "alerts", "processed_messages", "task_commands"]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") setError("Realtime connection failed; data can still be refreshed manually.");
    });
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      clearTimeout(initialRefresh);
      clearInterval(pollingFallback);
      void sb.removeChannel(channel);
    };
  }, [refresh, scheduleRefresh]);

  const mutate = useCallback(async (url: string, method: string, body?: Record<string, unknown>) => {
    await requestJson(url, { method, body: body ? JSON.stringify(body) : undefined });
    await refresh();
  }, [refresh]);

  const value = useMemo<OperationsContextValue>(() => ({
    snapshot, loading, error, refresh,
    issueCommand: async (command) => {
      const result = await requestJson("/api/operations/commands", { method: "POST", body: JSON.stringify(command) }) as { commandId: string };
      await refresh();
      return result.commandId;
    },
    createProject: (project) => mutate("/api/projects", "POST", project),
    updateProject: (id, project) => mutate(`/api/projects/${id}`, "PATCH", project),
    deleteProject: (id) => mutate(`/api/projects/${id}`, "DELETE"),
    createSubtask: (subtask) => mutate("/api/subtasks", "POST", subtask),
    updateSubtask: (id, subtask) => mutate(`/api/subtasks/${id}`, "PATCH", subtask),
    deleteSubtask: (id) => mutate(`/api/subtasks/${id}`, "DELETE"),
    createTechnician: (technician) => mutate("/api/technicians", "POST", technician),
    updateTechnician: (id, technician) => mutate(`/api/technicians/${id}`, "PATCH", technician),
    deleteTechnician: (id) => mutate(`/api/technicians/${id}`, "DELETE"),
  }), [snapshot, loading, error, refresh, mutate]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const value = useContext(OperationsContext);
  if (!value) throw new Error("useOperations must be used inside OperationsProvider");
  return value;
}
