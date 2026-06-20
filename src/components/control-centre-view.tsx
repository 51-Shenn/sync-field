"use client";

import { useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconCalendarClock, IconClipboardCheck, IconHelmet, IconUsers, IconX } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { useOperations } from "@/components/operations-provider";
import { PortfolioPulseChart, TaskStatusChart } from "@/components/charts";
import { useSiteReports } from "@/lib/use-data";
import type { SiteReport } from "@/lib/report-types";
import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, Input, Label, Progress, Select, Textarea } from "@/components/ui";
import { StatCard } from "@/components/page-elements";

const emptyReport = (): Omit<SiteReport, "id" | "createdAt"> => ({ projectId: "", title: "", type: "update", description: "", status: "open", createdBy: "", attachments: [] });

export function ControlCentreView() {
  const { data: session } = authClient.useSession();
  const { snapshot, loading, error, refresh } = useOperations();
  const { reports, createReport: pushReport } = useSiteReports();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState(emptyReport());
  const userName = session?.user.name?.trim() || session?.user.email?.split("@")[0] || "there";
  const activeProjects = snapshot.projects.filter((project) => project.status === "in_progress");
  const pendingTasks = snapshot.tasks.filter((task) => !["COMPLETE", "FAILED"].includes(task.state));
  const activeCrew = snapshot.technicians.filter((member) => ["active", "available"].includes(member.status));
  const openAlerts = snapshot.alerts.filter((alert) => alert.status === "pending");
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  async function createReport() {
    try { await pushReport(reportForm); setReportOpen(false); setReportForm(emptyReport()); } catch { /* silently handled */ }
  }

  async function resolveAlert(id: string) {
    try {
      await fetch(`/api/alerts/${id}`, { method: "PATCH" });
      await refresh();
    } catch { /* silently handled */ }
  }

  if (loading) return <Card className="p-16 text-center text-sm text-slate-500">Loading live operations…</Card>;
  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-orange-600">{today}</p><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good morning, <span className="text-orange-600">{userName}</span></h2><p className="mt-1 text-sm text-slate-500">Live project, DAG, workforce, alert, and Telegram pipeline status.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()}>Refresh</Button><Dialog open={reportOpen} onOpenChange={setReportOpen} trigger={<Button><IconClipboardCheck className="size-4" />Create report</Button>} title="Create site report"><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createReport(); }}><div><Label>Type</Label><Select value={reportForm.type} onChange={(event) => setReportForm({ ...reportForm, type: event.target.value as SiteReport["type"] })}><option value="update">Update</option><option value="issue">Issue</option></Select></div><div><Label>Title</Label><Input required value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} /></div><div><Label>Project</Label><Select required value={reportForm.projectId} onChange={(event) => setReportForm({ ...reportForm, projectId: event.target.value })}><option value="">Select project</option>{snapshot.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></div><div><Label>Description</Label><Textarea required value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} /></div><div className="flex justify-end"><Button type="submit">Create report</Button></div></form></Dialog></div></div>
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["/projects", <StatCard key="projects" label="Active projects" value={String(activeProjects.length)} trend={`${snapshot.projects.length} total`} icon={<IconHelmet className="size-5" />} />],
      ["/projects", <StatCard key="tasks" label="Open DAG tasks" value={String(pendingTasks.length)} trend={`${snapshot.tasks.filter((task) => task.state === "COMPLETE").length} complete`} icon={<IconCalendarClock className="size-5" />} accent="blue" />],
      ["/sites", <StatCard key="alerts" label="Open alerts" value={String(openAlerts.length)} trend={openAlerts.length ? "needs attention" : "all clear"} icon={<IconAlertTriangle className="size-5" />} accent="violet" />],
      ["/workforce", <StatCard key="crew" label="Available crew" value={String(activeCrew.length)} trend={`${snapshot.technicians.length} technicians`} icon={<IconUsers className="size-5" />} accent="emerald" />],
    ].map(([href, card]) => <Link key={String(href) + String((card as React.ReactElement).key)} href={String(href)}>{card}</Link>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]"><Card><CardHeader><div><CardTitle>Portfolio pulse</CardTitle><CardDescription className="mt-1">Planned versus actual progress from project dates and completed DAG nodes.</CardDescription></div></CardHeader><CardContent><PortfolioPulseChart projects={snapshot.projects} /></CardContent></Card><Card><CardHeader><div><CardTitle>DAG distribution</CardTitle><CardDescription className="mt-1">All canonical workflow states.</CardDescription></div></CardHeader><CardContent><TaskStatusChart tasks={snapshot.tasks} /></CardContent></Card></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><Card><CardHeader><div><CardTitle>Project progress</CardTitle><CardDescription className="mt-1">Completion calculated from backend tasks.</CardDescription></div></CardHeader><CardContent className="space-y-4">{activeProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50"><div className="flex justify-between"><div><p className="font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.client} · Due {project.endDate || "not set"}</p></div><span className="font-bold text-orange-600">{project.progress}%</span></div><Progress value={project.progress} className="mt-3" /></Link>)}{!activeProjects.length && <p className="py-8 text-center text-sm text-slate-500">No active projects.</p>}</CardContent></Card><Card><CardHeader><div><CardTitle>Upcoming deadlines</CardTitle><CardDescription className="mt-1">Canonical task deadlines.</CardDescription></div></CardHeader><CardContent className="space-y-2">{pendingTasks.filter((task) => task.deadline).sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))).slice(0, 6).map((task) => <Link key={task.id} href={`/projects/${task.projectId}#timeline`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700">{new Date(task.deadline!).getDate()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{task.title}</p><p className="text-xs text-slate-500">{snapshot.projects.find((project) => project.id === task.projectId)?.name}</p></div><Badge value={task.state.toLowerCase()} /></Link>)}</CardContent></Card></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><Card><CardHeader><div><CardTitle>Backend activity</CardTitle><CardDescription className="mt-1">DAG transitions written by Telegram and dashboard commands.</CardDescription></div></CardHeader><CardContent className="space-y-3">{snapshot.taskEvents.slice(0, 8).map((event) => { const task = snapshot.tasks.find((item) => item.id === event.taskId); return <Link key={event.id} href={task ? `/projects/${task.projectId}#activity` : "/projects"} className="flex gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"><Avatar name={event.triggeredBy || "System"} size="sm" /><div><p className="text-xs font-semibold text-slate-900">{task?.title || event.taskId} → {event.newState}</p><p className="mt-1 text-xs text-slate-500">{event.reason}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString()}</p></div></Link>; })}</CardContent></Card><Card><CardHeader><div><CardTitle>Alerts and command health</CardTitle><CardDescription className="mt-1">Failures remain visible until resolved.</CardDescription></div></CardHeader>      <CardContent className="space-y-3">
            {openAlerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-800">{alert.category || "Workflow alert"}</p>
                  <p className="mt-1 text-xs text-red-700">{alert.message}</p>
                </div>
                <button onClick={() => resolveAlert(alert.id)} className="shrink-0 rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600" title="Dismiss" aria-label="Dismiss alert"><IconX className="size-3.5" /></button>
              </div>
            ))}
            {snapshot.commands.filter((command) => command.status === "failed").slice(0, 5).map((command) => (
              <div key={command.id} className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
                <p className="text-xs font-semibold text-orange-800">{command.commandType} failed</p>
                <p className="mt-1 text-xs text-orange-700">{command.error || "Unknown worker error"}</p>
              </div>
            ))}
            {!openAlerts.length && !snapshot.commands.some((command) => command.status === "failed") && <p className="py-8 text-center text-sm text-slate-500">No open alerts or failed commands.</p>}
          </CardContent></Card></section>
    <p className="mt-4 text-[10px] text-slate-400">{reports.length} browser-local site reports remain available in Site Reporting and are outside this integration phase.</p>
  </>;
}
