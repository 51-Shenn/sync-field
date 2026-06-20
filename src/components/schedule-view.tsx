"use client";

import { useState } from "react";
import { IconChevronLeft, IconChevronRight, IconFilter, IconPlus } from "@tabler/icons-react";
import { projects, tasks } from "@/lib/mock-data";
import { Button, Card } from "@/components/ui";

const monthDays = [31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,1,2,3,4];
const weekdays = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

export function ScheduleView() {
  const [view, setView] = useState<"month"|"week">("month");
  const days = view === "month" ? monthDays : monthDays.slice(21,28);
  return <>
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2"><Button variant="outline" size="icon"><IconChevronLeft className="size-4"/></Button><Button variant="outline" size="icon"><IconChevronRight className="size-4"/></Button><Button variant="outline">Today</Button><h3 className="ml-2 text-lg font-semibold text-slate-950">June 2026</h3></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline"><IconFilter className="size-4"/>Filters</Button><div className="flex rounded-lg border border-slate-200 bg-white p-1"><Button size="sm" variant={view === "month" ? "secondary" : "ghost"} onClick={()=>setView("month")}>Month</Button><Button size="sm" variant={view === "week" ? "secondary" : "ghost"} onClick={()=>setView("week")}>Week</Button></div><Button><IconPlus className="size-4"/>Add task</Button></div>
    </div>
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{weekdays.map(day=><div key={day} className="px-2 py-3 text-center text-[10px] font-bold tracking-wider text-slate-400">{day}</div>)}</div>
      <div className="grid grid-cols-7">{days.map((day,index)=>{const monthIndex=view === "month" ? index : index+21; const isCurrent=monthIndex>0&&monthIndex<31; const dayTasks=isCurrent?tasks.filter(task=>Number(task.dueDate.split(" ")[1])===day).slice(0,3):[]; return <div key={index} className={`min-h-28 border-b border-r border-slate-100 p-1.5 sm:min-h-32 sm:p-2 ${!isCurrent?"bg-slate-50/60 text-slate-300":""}`}><span className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${day===20&&isCurrent?"bg-orange-500 text-white":""}`}>{day}</span><div className="mt-1 space-y-1">{dayTasks.map(task=>{const project=projects.find(p=>p.id===task.projectId)!;return <div key={task.id} className="overflow-hidden rounded px-1.5 py-1 text-[9px] font-medium leading-3 text-white sm:text-[10px]" style={{backgroundColor:project.color}} title={`${project.name}: ${task.title}`}><span className="hidden sm:inline">{task.title}</span><span className="sm:hidden">{project.name.split(" ")[0]}</span></div>})}</div></div>})}</div>
    </Card>
    <div className="mt-4 flex flex-wrap gap-4">{projects.slice(0,5).map(project=><span key={project.id} className="flex items-center gap-1.5 text-[11px] text-slate-500"><i className="size-2 rounded-full" style={{backgroundColor:project.color}}/>{project.name}</span>)}</div>
  </>;
}
