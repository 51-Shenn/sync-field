"use client";

import { useCallback, useSyncExternalStore, type SetStateAction } from "react";
import { siteReports, type SiteReport } from "@/lib/mock-data";

const STORAGE_KEY = "syncfield:site-reports";
const CHANGE_EVENT = "syncfield:site-reports-change";
let cachedRaw: string | null | undefined;
let cachedReports = siteReports;

function readReports(value: string | null) {
  if (!value) return siteReports;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as SiteReport[] : siteReports;
  } catch {
    return siteReports;
  }
}

function getSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedReports = readReports(raw);
  }
  return cachedReports;
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function useStoredReports() {
  const reports = useSyncExternalStore(subscribe, getSnapshot, () => siteReports);
  const setReports = useCallback((update: SetStateAction<SiteReport[]>) => {
    const current = getSnapshot();
    const next = typeof update === "function" ? update(current) : update;
    const raw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedReports = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [reports, setReports] as const;
}
