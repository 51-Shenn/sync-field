"use client";

import { useMemo, useState } from "react";
import { IconArrowUpRight, IconDownload, IconFileDescription, IconHelmet, IconTrendingUp } from "@tabler/icons-react";
import { CompletionChart, VarianceChart } from "@/components/charts";
import { PageHeader } from "@/components/page-elements";
import { useProjects, useSiteReports, useTeamMembers } from "@/lib/use-data";
import { Button, Card, CardContent, Select } from "@/components/ui";

type DateRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

const dateLabels: Record<DateRange, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "3m": "Last 3 months", "6m": "Last 6 months", "1y": "Last year", "all": "All time" };

const msInDay = 86_400_000;

export default function ReportsPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const { teamMembers } = useTeamMembers();
  const { reports } = useSiteReports();
  const [dateRange, setDateRange] = useState<DateRange>("6m");
  const [mountTime] = useState(() => Date.now());

  const filteredReports = useMemo(() => {
    if (dateRange === "all") return reports;
    const days = { "7d": 7, "30d": 30, "3m": 90, "6m": 180, "1y": 365 }[dateRange];
    const cutoff = new Date(mountTime - days * msInDay).toLocaleDateString();
    return reports.filter((r) => new Date(r.createdAt) >= new Date(cutoff));
  }, [reports, dateRange, mountTime]);

  const openIssues = reports.filter((r) => r.type === "issue" && r.status === "open").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const updates = reports.filter((r) => r.type === "update").length;

  const avgProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0;

  const activeCrew = teamMembers.filter((m) => m.status === "active").length;
  const crewUtil = teamMembers.length ? Math.round((activeCrew / teamMembers.length) * 100) : 0;

  function exportCSV() {
    const headers = ["Title", "Project", "Type", "Status", "Date", "Description"];
    const rows = filteredReports.map((r) => {
      const project = projects.find((p) => p.id === r.projectId);
      return [r.title, project?.name ?? "", r.type, r.status, r.createdAt, r.description].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        eyebrow="Portfolio intelligence"
        title="Reports"
        description="A clear view of delivery, schedule, and workforce performance."
        action={
          <div className="flex gap-2">
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}>
                {Object.entries(dateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            <Button onClick={exportCSV}><IconDownload className="size-4" />Export CSV</Button>
          </div>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><IconTrendingUp className="size-5" /></span><span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><IconArrowUpRight className="size-3.5" />{projects.length} total</span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{projectsLoading ? "—" : `${avgProgress}%`}</p><p className="mt-1 text-sm text-slate-500">Avg. project completion</p></CardContent></Card>
        <Card><CardContent><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><IconFileDescription className="size-5" /></span><span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><IconArrowUpRight className="size-3.5" />{reports.length} reports</span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{openIssues}</p><p className="mt-1 text-sm text-slate-500">Open site issues</p></CardContent></Card>
        <Card><CardContent><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><IconHelmet className="size-5" /></span><span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><IconArrowUpRight className="size-3.5" />{teamMembers.length} crew</span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{crewUtil}%</p><p className="mt-1 text-sm text-slate-500">Crew utilization</p></CardContent></Card>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card><div className="p-5 pb-0"><h3 className="font-semibold text-slate-950">Project completion rates</h3><p className="mt-1 text-xs text-slate-500">Portfolio progress by project</p></div><CardContent><CompletionChart projects={projects} /></CardContent></Card>
        <Card><div className="p-5 pb-0"><h3 className="font-semibold text-slate-950">Schedule variance</h3><p className="mt-1 text-xs text-slate-500">Monthly forecast vs. actual</p></div><CardContent><VarianceChart /></CardContent></Card>
        <Card className="xl:col-span-2"><div className="p-5 pb-0"><h3 className="font-semibold text-slate-950">Site report summary</h3><p className="mt-1 text-xs text-slate-500">Reports by type and status</p></div><CardContent className="grid gap-4 sm:grid-cols-3 pb-5"><div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"><p className="text-2xl font-bold text-blue-600">{updates}</p><p className="mt-1 text-xs text-slate-500">Site updates</p></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"><p className="text-2xl font-bold text-red-600">{openIssues}</p><p className="mt-1 text-xs text-slate-500">Open issues</p></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{resolved}</p><p className="mt-1 text-xs text-slate-500">Resolved</p></div></CardContent></Card>
      </section>
    </>
  );
}
