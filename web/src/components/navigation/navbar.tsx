"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { useAiStore } from "@/stores/ai-store"

export function Navbar() {
  const { openDrawer } = useAiStore()

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 left-0 right-0 w-full flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
        <span>Workspace</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-200 font-medium">Alpha Core Team</span>
      </div>

      <div className="flex items-center gap-4 max-w-xl w-full justify-end">
        <div className="flex items-center -space-x-1.5 mr-1">
          <div className="w-6 h-6 rounded-full border border-zinc-950 bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center">JD</div>
          <div className="w-6 h-6 rounded-full border border-zinc-950 bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">AM</div>
        </div>

        <button
          type="button"
          onClick={openDrawer}
          className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask AI</span>
        </button>
      </div>
    </header>
  )
}