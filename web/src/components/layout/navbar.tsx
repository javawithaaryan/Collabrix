"use client" // <--- 1. This must be the absolute first line

import React from "react"
import { Sparkles } from "lucide-react"
// ... your other imports
import { useAiStore } from "@/stores/ai-store" // <--- 2. Import the store

export function AppShell({ children }: { children: React.ReactNode }) {
  
  const { openDrawer } = useAiStore() // <--- 3. Initialize the hook

  return (
    <div className="flex h-screen w-full">
      {/* ... your sidebar code ... */}

      <div className="flex flex-col flex-1">
        {/* THIS IS YOUR HEADER AREA */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>{/* Search bar or breadcrumbs usually go here */}</div>
          
          {/* 4. DROP THE BUTTON HERE! */}
          <button 
            onClick={() => {
              alert("1. THE BUTTON WORKS!");
              openDrawer();
            }}
            className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}