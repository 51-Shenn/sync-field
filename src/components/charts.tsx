"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  type PieLabelRenderProps,
} from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/chart";
import { projects, tasks } from "@/lib/mock-data";

const axisProps = { axisLine: false, tickLine: false, fontSize: 11 } as const;
const animationProps = { isAnimationActive: true, animationDuration: 900, animationEasing: "ease-out" as const };

const completionConfig = {
  progress: { label: "Complete", color: "#f97316" },
} satisfies ChartConfig;

export function CompletionChart() {
  const data = projects.map((project) => ({ name: project.name.split(" ")[0], progress: project.progress }));
  return (
    <ChartContainer config={completionConfig} className="h-64">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }} accessibilityLayer>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis dataKey="name" type="category" width={70} {...axisProps} />
        <ChartTooltip cursor={{ fill: "#f8fafc" }} content={(props) => <ChartTooltipContent {...props} valueFormatter={(value) => `${value}%`} />} />
        <Bar dataKey="progress" radius={[0, 5, 5, 0]} {...animationProps}>
          {data.map((_, index) => <Cell key={index} fill={index === 0 ? "var(--color-progress)" : "#1e3a5f"} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const varianceConfig = {
  variance: { label: "Variance", color: "#f97316" },
} satisfies ChartConfig;

export function VarianceChart() {
  const data = [{ month: "Jan", variance: -2 }, { month: "Feb", variance: 1 }, { month: "Mar", variance: -1 }, { month: "Apr", variance: 3 }, { month: "May", variance: 2 }, { month: "Jun", variance: 4 }];
  return (
    <ChartContainer config={varianceConfig} className="h-64">
      <AreaChart data={data} margin={{ left: -20, right: 6 }} accessibilityLayer>
        <defs><linearGradient id="variance-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-variance)" stopOpacity=".3" /><stop offset="1" stopColor="var(--color-variance)" stopOpacity="0" /></linearGradient></defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(value) => `${value}%`} />
        <ChartTooltip content={(props) => <ChartTooltipContent {...props} valueFormatter={(value) => `${value}%`} />} />
        <Area type="monotone" dataKey="variance" stroke="var(--color-variance)" fill="url(#variance-fill)" strokeWidth={2} {...animationProps} />
      </AreaChart>
    </ChartContainer>
  );
}

const utilizationConfig = {
  utilization: { label: "Utilization", color: "#1e3a5f" },
} satisfies ChartConfig;

export function UtilizationChart() {
  const data = [{ month: "Jan", utilization: 71 }, { month: "Feb", utilization: 76 }, { month: "Mar", utilization: 79 }, { month: "Apr", utilization: 82 }, { month: "May", utilization: 86 }, { month: "Jun", utilization: 84 }];
  return (
    <ChartContainer config={utilizationConfig} className="h-64">
      <LineChart data={data} margin={{ left: -20, right: 10 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis domain={[60, 100]} {...axisProps} tickFormatter={(value) => `${value}%`} />
        <ChartTooltip content={(props) => <ChartTooltipContent {...props} valueFormatter={(value) => `${value}%`} />} />
        <Line type="monotone" dataKey="utilization" stroke="var(--color-utilization)" strokeWidth={3} dot={{ fill: "#fff", stroke: "var(--color-utilization)", strokeWidth: 2, r: 4 }} {...animationProps} />
      </LineChart>
    </ChartContainer>
  );
}

const pulseConfig = {
  planned: { label: "Planned", color: "#cbd5e1" },
  actual: { label: "Actual", color: "#f97316" },
} satisfies ChartConfig;

export function PortfolioPulseChart() {
  const data = [
    { week: "May 16", planned: 42, actual: 39 },
    { week: "May 23", planned: 45, actual: 43 },
    { week: "May 30", planned: 49, actual: 47 },
    { week: "Jun 06", planned: 53, actual: 51 },
    { week: "Jun 13", planned: 57, actual: 56 },
    { week: "Jun 20", planned: 61, actual: 59 },
  ];

  return (
    <ChartContainer config={pulseConfig} className="h-[280px]">
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }} accessibilityLayer>
        <defs>
          <linearGradient id="actual-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-actual)" stopOpacity=".28" /><stop offset="1" stopColor="var(--color-actual)" stopOpacity="0" /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" {...axisProps} />
        <YAxis domain={[30, 70]} {...axisProps} tickFormatter={(value) => `${value}%`} />
        <ChartTooltip content={(props) => <ChartTooltipContent {...props} valueFormatter={(value) => `${value}%`} />} />
        <Legend verticalAlign="bottom" content={() => <ChartLegendContent keys={["actual", "planned"]} />} />
        <Area type="monotone" dataKey="planned" stroke="var(--color-planned)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" dot={false} {...animationProps} />
        <Area type="monotone" dataKey="actual" stroke="var(--color-actual)" fill="url(#actual-fill)" strokeWidth={3} dot={{ fill: "#fff", stroke: "var(--color-actual)", strokeWidth: 2, r: 3 }} {...animationProps} />
      </AreaChart>
    </ChartContainer>
  );
}

const taskConfig = {
  todo: { label: "To do", color: "#94a3b8" },
  in_progress: { label: "In progress", color: "#f97316" },
  review: { label: "In review", color: "#8b5cf6" },
  done: { label: "Done", color: "#10b981" },
} satisfies ChartConfig;

function PieSegmentLabel({ cx, cy, midAngle, middleRadius, value }: PieLabelRenderProps) {
  if (!value || typeof cx !== "number" || typeof cy !== "number" || midAngle == null || middleRadius == null) return null;
  const angle = -midAngle * (Math.PI / 180);
  const x = cx + middleRadius * Math.cos(angle);
  const y = cy + middleRadius * Math.sin(angle);
  return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-white text-[13px] font-bold tabular-nums">{value}</text>;
}

export function TaskStatusChart() {
  const data = Object.keys(taskConfig).map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
    fill: taskConfig[status as keyof typeof taskConfig].color,
  }));
  const complete = data.find((item) => item.status === "done")?.count ?? 0;

  return (
    <ChartContainer config={taskConfig} className="h-[280px]">
      <PieChart accessibilityLayer>
        <ChartTooltip content={(props) => <ChartTooltipContent {...props} hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={62} outerRadius={90} paddingAngle={3} stroke="transparent" label={PieSegmentLabel} labelLine={false} {...animationProps}>
          {data.map((item) => <Cell key={item.status} fill={item.fill} />)}
        </Pie>
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-950 text-3xl font-bold">{complete}</text>
        <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[11px]">completed</text>
        <Legend verticalAlign="bottom" content={() => <ChartLegendContent keys={["todo", "in_progress", "review", "done"]} />} />
      </PieChart>
    </ChartContainer>
  );
}
