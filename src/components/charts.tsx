"use client";

import type { ComponentProps } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer as RechartsResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { projects } from "@/lib/mock-data";

const tooltipStyle = { borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,.08)", fontSize: 12 };
function ResponsiveContainer(props: ComponentProps<typeof RechartsResponsiveContainer>) { return <RechartsResponsiveContainer initialDimension={{ width: 600, height: 256 }} {...props} />; }

export function CompletionChart() {
  const data = projects.map((p) => ({ name: p.name.split(" ")[0], progress: p.progress }));
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}><XAxis type="number" domain={[0,100]} hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} fontSize={11} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Complete"]} /><Bar dataKey="progress" radius={[0,5,5,0]}>{data.map((_, i) => <Cell key={i} fill={i === 0 ? "#f97316" : "#1e3a5f"} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

export function VarianceChart() {
  const data = [{m:"Jan",v:-2},{m:"Feb",v:1},{m:"Mar",v:-1},{m:"Apr",v:3},{m:"May",v:2},{m:"Jun",v:4}];
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left:-20,right:6 }}><defs><linearGradient id="orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f97316" stopOpacity=".3"/><stop offset="1" stopColor="#f97316" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#eef2f7"/><XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v)=>`${v}%`}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="v" stroke="#f97316" fill="url(#orange)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>;
}

export function UtilizationChart() {
  const data=[{m:"Jan",v:71},{m:"Feb",v:76},{m:"Mar",v:79},{m:"Apr",v:82},{m:"May",v:86},{m:"Jun",v:84}];
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{left:-20,right:10}}><CartesianGrid vertical={false} stroke="#eef2f7"/><XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={11}/><YAxis domain={[60,100]} axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v)=>`${v}%`}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="v" stroke="#1e3a5f" strokeWidth={3} dot={{fill:"#fff",stroke:"#1e3a5f",strokeWidth:2,r:4}}/></LineChart></ResponsiveContainer></div>;
}
