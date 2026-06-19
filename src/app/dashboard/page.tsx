"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface Task {
  id: string
  task_name: string
  state: string
  dependencies: string[]
  assigned_to: string | null
  failure_category: string | null
  attempt_count: number
}

interface TaskEvent {
  task_id: string
  old_state: string
  new_state: string
  reason: string
  triggered_by: string
}

const STATE_COLORS: Record<string, string> = {
  LOCKED: "bg-gray-200 text-gray-700",
  READY: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-yellow-100 text-yellow-800",
  BLOCKED: "bg-red-100 text-red-800",
  REGRESSED: "bg-orange-100 text-orange-800",
  COMPLETE: "bg-green-100 text-green-800",
  FAILED: "bg-gray-800 text-white",
}

function TaskNode({ task, highlighted }: { task: Task; highlighted: boolean }) {
  return (
    <div
      className={`border-2 rounded-lg p-3 transition-all duration-500 ${
        highlighted ? "border-red-500 shadow-lg shadow-red-200 scale-105" : "border-gray-200"
      } ${STATE_COLORS[task.state] || "bg-gray-100"}`}
    >
      <div className="font-semibold text-sm">{task.id}</div>
      <div className="text-xs truncate">{task.task_name}</div>
      <div className="text-xs font-medium mt-1">{task.state}</div>
      {task.assigned_to && <div className="text-xs text-gray-500 mt-0.5">{task.assigned_to}</div>}
      {task.failure_category && (
        <div className="text-xs font-bold text-red-600 mt-0.5">{task.failure_category}</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map())
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*")
    if (data) {
      setTasks(new Map(data.map((t: Task) => [t.id, t])))
    }
  }, [])

  useEffect(() => {
    loadTasks()

    const channel = supabase
      .channel("dag-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const updated = payload.new as Task
          setTasks((prev) => {
            const next = new Map(prev)
            next.set(updated.id, updated)
            return next
          })
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_events" },
        (payload) => {
          const event = payload.new as TaskEvent
          setEvents((prev) => [...prev, event])
          setHighlightedTask(event.task_id)
          setTimeout(() => setHighlightedTask(null), 1500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadTasks])

  const taskList = Array.from(tasks.values())

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dispatcher Dashboard</h1>
        <div className="flex gap-2 text-xs">
          {Object.entries(STATE_COLORS).map(([state, cls]) => (
            <span key={state} className={`px-2 py-0.5 rounded ${cls}`}>
              {state}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {taskList.map((task) => (
          <TaskNode key={task.id} task={task} highlighted={highlightedTask === task.id} />
        ))}
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Event Log</h2>
        <div className="h-48 overflow-y-auto space-y-1 text-xs font-mono">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex gap-2 animate-in slide-in-from-left-2 fade-in duration-300"
            >
              <span className="text-gray-400 shrink-0">
                {ev.triggered_by === "cascade" ? "🔗" : "👤"}
              </span>
              <span className="text-gray-500 shrink-0">{ev.task_id}</span>
              <span className="text-gray-400">{ev.old_state}</span>
              <span className="text-gray-300">→</span>
              <span className="font-medium">{ev.new_state}</span>
              <span className="text-gray-400 truncate">{ev.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
