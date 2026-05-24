"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { Column, Task } from "@/types/board"
import { TaskCard } from "./task-card"

interface BoardColumnProps {
  column: Column
  tasks: Task[]
}

export function BoardColumn({ column, tasks }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  })

  return (
    <div className="flex flex-col w-[320px] shrink-0 bg-zinc-950 rounded-xl">
      <div className="flex items-center justify-between p-3 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">{column.title}</h3>
          <span className="flex items-center justify-center w-5 h-5 rounded bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-3 min-h-37.5 p-2 bg-zinc-950/50 rounded-lg border border-transparent transition-colors"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}