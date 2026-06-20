"use client";

import { useCallback, useSyncExternalStore, type SetStateAction } from "react";
import { defaultResources, type Resource } from "@/lib/resource-data";

const STORAGE_KEY = "syncfield:resources";
const CHANGE_EVENT = "syncfield:resources-change";
let cachedRaw: string | null | undefined;
let cachedResources = defaultResources;

function parseStoredResources(value: string | null) {
  if (!value) return defaultResources;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as Resource[] : defaultResources;
  } catch {
    return defaultResources;
  }
}

function getSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedResources = parseStoredResources(raw);
  }
  return cachedResources;
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

export function useStoredResources() {
  const resources = useSyncExternalStore(subscribe, getSnapshot, () => defaultResources);
  const setResources = useCallback((update: SetStateAction<Resource[]>) => {
    const current = getSnapshot();
    const next = typeof update === "function" ? update(current) : update;
    const raw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedResources = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [resources, setResources] as const;
}
