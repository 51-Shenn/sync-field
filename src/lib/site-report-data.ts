import type { SiteReport } from "@/lib/report-types";

export type SiteReportFilters = {
  query: string;
  projectId: string;
  type: string;
  status: string;
};

export function filterSiteReports(
  reports: SiteReport[],
  filters: SiteReportFilters,
  projectNames: Record<string, string>,
) {
  const query = filters.query.trim().toLowerCase();
  return reports.filter((report) => {
    if (filters.projectId !== "all" && report.projectId !== filters.projectId) return false;
    if (filters.type !== "all" && report.type !== filters.type) return false;
    if (filters.status !== "all" && report.status !== filters.status) return false;
    if (!query) return true;
    const searchable = `${report.title} ${report.description} ${report.type} ${report.status} ${projectNames[report.projectId] ?? ""} ${report.attachments.join(" ")}`.toLowerCase();
    return searchable.includes(query);
  });
}

export function summarizeSiteReports(reports: SiteReport[]) {
  return {
    total: reports.length,
    openIssues: reports.filter((report) => report.type === "issue" && report.status === "open").length,
    updates: reports.filter((report) => report.type === "update").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
  };
}
