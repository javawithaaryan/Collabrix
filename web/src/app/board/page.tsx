import React from "react"
import { KanbanBoard } from "@/features/board/kanban-board"
import { TaskDetailsPanel } from "@/features/tasks/task-details-panel"
import { Sparkles, Filter } from "lucide-react"

export default function BoardPage() {
  return (
    <div className="flex flex-col h-full space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Sprint Board</h1>
          <p className="text-sm text-zinc-400">Manage tasks and realtime synchronization.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition-all">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden mt-4 relative">
        <KanbanBoard />
      </div>

      <TaskDetailsPanel />
    </div>
  )
}