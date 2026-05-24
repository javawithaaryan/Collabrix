"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MessageSquare, GripVertical } from "lucide-react"
import { Task } from "@/types/board"
import { cn } from "@/lib/utils"
import { useBoardStore } from "@/stores/board-store"

interface TaskCardProps {
  task: Task
}

const priorityColors = {
  low: "bg-zinc-800 text-zinc-300",
  medium: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  urgent: "bg-red-500/10 text-red-400 border border-red-500/20",
}

export function TaskCard({ task }: TaskCardProps) {
  const { setSelectedTask } = useBoardStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-30 bg-zinc-900/50 border-2 border-dashed border-zinc-700 rounded-xl"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedTask(task.id)}
      className="group flex flex-col gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:shadow-md cursor-grab active:cursor-grabbing transition-colors relative"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-200 leading-snug">
          {task.title}
        </p>
        <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider", priorityColors[task.priority])}>
          {task.priority}
        </span>
        
        {task.labels.map((label) => (
          <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/50">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm", task.assignee.color)}>
              {task.assignee.initials}
            </div>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 border-dashed" />
        )}

        <div className="flex items-center gap-1.5 text-zinc-500">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{task.commentsCount}</span>
        </div>
      </div>
    </div>
  )
}