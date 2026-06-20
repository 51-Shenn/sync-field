"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCalendarClock, IconClipboardCheck, IconDots, IconAlertTriangle, IconHelmet, IconUsers } from "@tabler/icons-react";
import { activities, auditLogs as initialLogs, projects, tasks, teamMembers, type AuditLog, type SiteReport } from "@/lib/mock-data";
import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, Input, Label, Progress, Select, Textarea } from "@/components/ui";
import { StatCard } from "@/components/page-elements";
import { authClient } from "@/lib/auth-client";
import { PortfolioPulseChart, TaskStatusChart } from "@/components/charts";
import { useStoredReports } from "@/lib/use-stored-reports";

const emptyReport = (): Omit<SiteReport, "id" | "createdAt"> => ({
  projectId: "",
  title: "",
  type: "update",
  description: "",
  status: "open",
  createdBy: teamMembers[0]?.id ?? "",
  attachments: [],
});

function projectFromActivity(target: string) {
  return projects.find((project) => target.includes(project.name.split(" ")[0]));
}

function auditHref(log: AuditLog) {
  if (log.entity === "project" && projects.some((project) => project.id === log.entityId)) return `/projects/${log.entityId}`;
  if (log.entity === "report") return "/sites";
  if (log.entity === "worker") return "/workforce";
  if (log.entity === "resource") return "/resources";
  return "/control-centre";
}

export function ControlCentreView() {
  const { data: session } = authClient.useSession();
  const [logs, setLogs] = useState(initialLogs);
  const [reports, setReports] = useStoredReports();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState(emptyReport());
  const userName = session?.user.name?.trim() || session?.user.email?.split("@")[0] || "there";
  const openIssues = reports.filter(r => r.type === "issue" && r.status === "open").length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const totalCrew = teamMembers.filter(m => m.status === "active").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const active = projects.filter(p => p.status === "in_progress");
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  function createReport() {
    const createdAt = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const report: SiteReport = { id: `sr${Date.now()}`, createdAt, ...reportForm };
    const audit: AuditLog = {
      id: `al${Date.now()}`,
      action: "created",
      entity: "report",
      entityId: report.id,
      entityName: report.title,
      performedBy: userName,
      timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      details: `${report.type === "issue" ? "Issue" : "Site update"} report created.`,
    };
    setReports((current) => [report, ...current]);
    setLogs((current) => [audit, ...current]);
    setReportOpen(false);
    setReportForm(emptyReport());
  }

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-orange-600">{today}</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good morning, <span className="text-orange-600">{userName}</span></h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Here&apos;s what&apos;s happening across your jobsites today.</p>
      </div>
      <Dialog open={reportOpen} onOpenChange={(open) => { setReportOpen(open); if (!open) setReportForm(emptyReport()); }} trigger={<Button><IconClipboardCheck className="size-4" />Create report</Button>} title="Create site report" description="Log an update or issue from the Control Centre.">
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createReport(); }}>
          <div><Label>Report type</Label><div className="grid grid-cols-2 gap-2"><Button type="button" variant={reportForm.type === "update" ? "secondary" : "outline"} onClick={() => setReportForm({ ...reportForm, type: "update" })}>Site update</Button><Button type="button" variant={reportForm.type === "issue" ? "secondary" : "outline"} onClick={() => setReportForm({ ...reportForm, type: "issue" })}>Issue</Button></div></div>
          <div><Label>Title</Label><Input required value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} placeholder="Brief report summary" /></div>
          <div><Label>Project</Label><Select required value={reportForm.projectId} onChange={(event) => setReportForm({ ...reportForm, projectId: event.target.value })}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></div>
          <div><Label>Description</Label><Textarea required value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} placeholder="Describe progress, observations, or the issue..." /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button><Button type="submit">Create report</Button></div>
        </form>
      </Dialog>
    </div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { href: "/projects", card: <StatCard label="Active projects" value={String(activeProjects)} trend="+1 this month" icon={<IconHelmet className="size-5" />} /> },
        { href: "/projects", card: <StatCard label="Tasks due this week" value={String(pendingTasks)} trend="6 completed" icon={<IconCalendarClock className="size-5" />} accent="blue" /> },
        { href: "/sites", card: <StatCard label="Open issues" value={String(openIssues)} trend={openIssues > 0 ? "needs attention" : "all clear"} icon={<IconAlertTriangle className="size-5" />} accent={openIssues > 0 ? "violet" : "emerald"} /> },
        { href: "/workforce", card: <StatCard label="Crew on site" value={String(totalCrew)} trend="active today" icon={<IconUsers className="size-5" />} accent="emerald" /> },
      ].map(({ href, card }, index) => <Link key={href + index} href={href} className="dashboard-rise rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-orange-500/30" style={{ animationDelay: `${index * 70}ms` }}>{card}</Link>)}
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Portfolio pulse</CardTitle>
            <CardDescription className="mt-1">Planned versus actual completion across active projects</CardDescription>
          </div>
          <Link href="/reports" aria-label="View portfolio reports"><Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/15 transition-colors hover:bg-emerald-100">On track</Badge></Link>
        </CardHeader>
        <CardContent className="pt-3"><PortfolioPulseChart /></CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Task distribution</CardTitle>
            <CardDescription className="mt-1">Current workflow status across every project</CardDescription>
          </div>
          <Link href="/projects" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View tasks</Link>
        </CardHeader>
        <CardContent className="pt-3"><TaskStatusChart /></CardContent>
      </Card>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader><div><CardTitle>Project progress</CardTitle><CardDescription className="mt-1">Live progress across active sites</CardDescription></div><Link href="/projects" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View all</Link></CardHeader>
        <CardContent className="space-y-5 pt-3">
          {active.map(project => (
            <div key={project.id} className="group grid gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70 sm:grid-cols-[1fr_150px_44px] sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: project.color }}>
                  {project.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-slate-900 hover:text-orange-600">{project.name}</Link>
                  <p className="mt-0.5 text-xs text-slate-500">{project.client} &middot; Due {project.endDate}</p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>{project.progress}% complete</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <Link href={`/projects/${project.id}`} aria-label={`Open ${project.name}`} className="hidden size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 sm:flex"><IconDots className="size-4" /></Link>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Upcoming deadlines</CardTitle><CardDescription className="mt-1">Next 10 days</CardDescription></div><Link href="/projects" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View all</Link></CardHeader>
        <CardContent className="space-y-1 pt-3">
          {tasks.filter(t => t.status !== "done").slice(0, 6).map((task, i) => {
            const project = projects.find(p => p.id === task.projectId)!;
            return (
              <Link key={task.id} href={`/projects/${project.id}#schedule`} className="flex gap-3 rounded-lg px-2 py-3 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-500/30">
                <div className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-lg ${i < 2 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                  <span className="text-[9px] font-bold uppercase">{task.dueDate.split(" ")[0]}</span>
                  <span className="text-sm font-bold">{task.dueDate.split(" ")[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    <i className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </p>
                </div>
                <Badge value={task.priority} />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader><div><CardTitle>Recent activity</CardTitle><CardDescription className="mt-1">Updates from your team</CardDescription></div><Link href="/sites" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View reports</Link></CardHeader>
        <CardContent className="pt-3">
          {activities.map((item, i) => {
            const activityProject = projectFromActivity(item.target);
            return <Link key={i} href={activityProject ? `/projects/${activityProject.id}` : "/sites"} className="relative flex gap-3 rounded-lg pb-5 outline-none last:pb-0 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-500/30">
              <div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-100 last:hidden" />
              <Avatar name={item.person + " Team"} />
              <div className="pt-0.5 text-sm leading-5 text-slate-600">
                <span className="font-semibold text-slate-900">{item.person}</span> {item.action} <span className="font-medium text-slate-800">{item.target}</span>
                <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
              </div>
            </Link>;
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Audit trail</CardTitle><CardDescription className="mt-1">Recent CRUD actions across the platform</CardDescription></div><Link href="/reports" className="text-xs font-semibold text-orange-600 hover:text-orange-700">View reports</Link></CardHeader>
        <CardContent className="space-y-2 pt-3">
          {logs.slice(0, 8).map(log => (
            <Link key={log.id} href={auditHref(log)} className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-500/30">
              <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${log.action === "created" ? "bg-emerald-500" : log.action === "deleted" ? "bg-red-500" : "bg-orange-500"}`}>
                {log.action === "created" ? "+" : log.action === "deleted" ? "–" : "~"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900">
                  <span className="capitalize">{log.action}</span> {log.entity} <span className="font-normal text-slate-600">&ldquo;{log.entityName}&rdquo;</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{log.details}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{log.performedBy} &middot; {log.timestamp}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  </>;
}
