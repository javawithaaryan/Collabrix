"use client"

import React, { useEffect } from "react"
import { X, AlignLeft, MessageSquare, Sparkles, Tag, User } from "lucide-react"
import { useBoardStore } from "@/stores/board-store"
import { cn } from "@/lib/utils"

export function TaskDetailsPanel() {
  const { tasks, selectedTaskId, setSelectedTask } = useBoardStore()
  const task = tasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTask(null)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [setSelectedTask])

  return (
    <>
      {selectedTaskId && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedTask(null)}
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-125 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform",
          selectedTaskId ? "translate-x-0" : "translate-x-full"
        )}
      >
        {task && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500 uppercase">{task.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {task.columnId.replace("-", " ").toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-100 leading-tight">{task.title}</h2>
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors group cursor-pointer text-left">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-400 group-hover:animate-pulse" />
                    <span className="text-sm font-medium text-indigo-200">Ask AI to break down this task</span>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium"><User className="w-3.5 h-3.5" /> Assignee</div>
                  {task.assignee ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-200 mt-1">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white", task.assignee.color)}>{task.assignee.initials}</div>
                      <span>{task.assignee.name}</span>
                    </div>
                  ) : <span className="text-sm text-zinc-500 mt-1 block">Unassigned</span>}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium"><Tag className="w-3.5 h-3.5" /> Priority</div>
                  <span className="text-sm text-zinc-200 mt-1 capitalize block">{task.priority}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-100"><AlignLeft className="w-4 h-4 text-zinc-500" /> Description</div>
                <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  {task.description || "No description provided. Click to add one."}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}