import { CalendarClock, CircleDollarSign, ClipboardCheck, HardHat, MoreHorizontal } from "lucide-react";
import { activities, projects, tasks } from "@/lib/mock-data";
import { BudgetTrendChart } from "@/components/charts";
import { PageHeader, SectionTitle, StatCard } from "@/components/page-elements";
import { Avatar, Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const active = projects.filter(p=>p.status==="in_progress");
  return <>
    <PageHeader eyebrow="Friday, June 20" title="Good morning, Marcus" description="Here’s what’s happening across your jobsites today." action={<Button><ClipboardCheck className="size-4"/>Create report</Button>}/>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active projects" value="5" trend="+1 this month" icon={<HardHat className="size-5"/>}/>
      <StatCard label="Tasks due this week" value="18" trend="6 completed" icon={<CalendarClock className="size-5"/>} accent="blue"/>
      <StatCard label="Total budget spent" value="$35.3M" trend="58% utilized" icon={<CircleDollarSign className="size-5"/>} accent="emerald"/>
      <StatCard label="Crew on site today" value="126" trend="92% checked in" icon={<HardHat className="size-5"/>} accent="violet"/>
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card><div className="p-5 pb-2"><SectionTitle title="Project progress" description="Live progress across active sites" href="/projects"/></div><CardContent className="space-y-5 pt-3">{active.map(project=><div key={project.id} className="group grid gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70 sm:grid-cols-[1fr_150px_44px] sm:items-center"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg text-xs font-bold text-white" style={{backgroundColor:project.color}}>{project.name.split(" ").map(n=>n[0]).join("")}</div><div><p className="text-sm font-semibold text-slate-900">{project.name}</p><p className="mt-0.5 text-xs text-slate-500">{project.client} · Due {project.endDate}</p></div></div><div><div className="mb-1.5 flex justify-between text-[11px] text-slate-500"><span>{formatCurrency(project.spent,true)} spent</span><span>{project.progress}%</span></div><Progress value={project.progress}/></div><Button variant="ghost" size="icon" className="hidden sm:flex"><MoreHorizontal className="size-4"/></Button></div>)}</CardContent></Card>
      <Card><div className="p-5 pb-2"><SectionTitle title="Upcoming deadlines" description="Next 10 days" href="/schedule"/></div><CardContent className="space-y-1 pt-3">{tasks.filter(t=>t.status!=="done").slice(0,6).map((task,i)=>{const project=projects.find(p=>p.id===task.projectId)!; return <div key={task.id} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"><div className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-lg ${i<2?"bg-orange-50 text-orange-700":"bg-slate-100 text-slate-600"}`}><span className="text-[9px] font-bold uppercase">Jun</span><span className="text-sm font-bold">{task.dueDate.split(" ")[1]}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500"><i className="mr-1.5 inline-block size-2 rounded-full" style={{backgroundColor:project.color}}/>{project.name}</p></div><Badge value={task.priority}/></div>})}</CardContent></Card>
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <Card><div className="p-5 pb-0"><SectionTitle title="Budget performance" description="Spent vs. budgeted · USD millions"/><div className="mt-4 flex gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-slate-200"/>Budgeted</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-orange-500"/>Spent</span></div></div><CardContent className="pb-2"><BudgetTrendChart/></CardContent></Card>
      <Card><div className="p-5 pb-2"><SectionTitle title="Recent activity" description="Updates from your team"/></div><CardContent className="pt-3">{activities.map((item,i)=><div key={i} className="relative flex gap-3 pb-5 last:pb-0"><div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-100 last:hidden"/><Avatar name={item.person + " Team"}/><div className="pt-0.5 text-sm leading-5 text-slate-600"><span className="font-semibold text-slate-900">{item.person}</span> {item.action} <span className="font-medium text-slate-800">{item.target}</span><p className="mt-1 text-[11px] text-slate-400">{item.time}</p></div></div>)}</CardContent></Card>
    </section>
  </>;
}
