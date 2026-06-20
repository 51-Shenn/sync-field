export type ResourceType = "equipment" | "material" | "fuel";

export type Resource = {
  id: string;
  name: string;
  type: ResourceType;
  allocated: number;
  available: number;
  projectId: string;
};

export const defaultResources: Resource[] = [
  { id: "r1", name: "Tower Crane #2", type: "equipment", allocated: 1, available: 1, projectId: "riverside" },
  { id: "r2", name: "Concrete Pump", type: "equipment", allocated: 2, available: 3, projectId: "oakwood" },
  { id: "r3", name: "Rebar #8", type: "material", allocated: 120, available: 400, projectId: "riverside" },
  { id: "r4", name: "Diesel (gallons)", type: "fuel", allocated: 800, available: 2000, projectId: "harbor" },
];

export function filterResources(
  resources: Resource[],
  filters: { query: string; type: string; projectId: string },
  projectNames: Record<string, string>,
) {
  const query = filters.query.trim().toLowerCase();
  return resources.filter((resource) => {
    if (filters.type !== "all" && resource.type !== filters.type) return false;
    if (filters.projectId !== "all" && resource.projectId !== filters.projectId) return false;
    if (!query) return true;
    const searchable = `${resource.name} ${resource.type} ${projectNames[resource.projectId] ?? ""}`.toLowerCase();
    return searchable.includes(query);
  });
}

export function normalizeResourceType(value: string): ResourceType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "equipment" || normalized === "material" || normalized === "fuel") return normalized;
  if (normalized === "materials") return "material";
  return null;
}
