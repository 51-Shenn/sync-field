import Link from "next/link";
import { IconArrowUpRight, IconCalendarMonth, IconMapPin } from "@tabler/icons-react";
import { projects, teamMembers, type Project } from "@/lib/mock-data";
import { Avatar, AvatarStack, Badge, Card, CardContent, Progress } from "@/components/ui";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-orange-600">{eyebrow}</p>}<h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p></div>{action}</div>;
}

export function StatCard({ label, value, trend, icon, accent = "orange" }: { label: string; value: string; trend: string; icon: React.ReactNode; accent?: "orange"|"blue"|"emerald"|"violet" }) {
  const colors = { orange:"bg-orange-50 text-orange-600", blue:"bg-blue-50 text-blue-600", emerald:"bg-emerald-50 text-emerald-600", violet:"bg-violet-50 text-violet-600" };
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`flex size-10 items-center justify-center rounded-xl ${colors[accent]}`}>{icon}</div><span className="text-[11px] font-semibold text-emerald-600">{trend}</span></div><p className="mt-5 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></CardContent></Card>;
}

export function ProjectCard({ project }: { project: Project }) {
  const manager = teamMembers.find(m=>m.id===project.managerId); const names = project.teamIds.map(id=>teamMembers.find(m=>m.id===id)?.name).filter(Boolean) as string[];
  return <Link href={`/projects/${project.id}`}><Card className="group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"><div className="h-1.5" style={{backgroundColor:project.color}}/><CardContent><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950 group-hover:text-orange-600">{project.name}</h3><p className="mt-1 text-xs text-slate-500">{project.client}</p></div><Badge value={project.status}/></div><div className="mt-4 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><IconMapPin className="size-3.5"/>{project.location}</p><p className="flex items-center gap-2"><IconCalendarMonth className="size-3.5"/>{project.endDate}</p></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-600">Overall progress</span><span className="font-bold text-slate-900">{project.progress}%</span></div><Progress value={project.progress}/></div><div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><div className="flex items-center gap-3"><AvatarStack names={names}/>{manager && <Avatar name={manager.name} size="sm"/>}</div></div></CardContent></Card></Link>;
}


export function SectionTitle({ title, description, href }: { title: string; description?: string; href?: string }) { return <div className="flex items-start justify-between"><div><h3 className="font-semibold tracking-tight text-slate-950">{title}</h3>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>{href && <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700">View all <IconArrowUpRight className="size-3.5"/></Link>}</div>; }

export function ProjectLegend() { return <div className="flex flex-wrap gap-4">{projects.slice(0,4).map(p=><span key={p.id} className="flex items-center gap-1.5 text-[11px] text-slate-500"><i className="size-2 rounded-full" style={{backgroundColor:p.color}}/>{p.name}</span>)}</div>; }
