"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { KanbanSquare, Terminal, BookOpen, Activity, Bell, Settings, ChevronLeft, ChevronRight, LayoutDashboard, FolderGit2 } from "lucide-react"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Kanban Board", href: "/board", icon: KanbanSquare },
  { name: "Code Snippets", href: "/snippets", icon: Terminal },
  { name: "Wiki Docs", href: "/wiki", icon: BookOpen },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={cn("h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between transition-all duration-300 relative z-20", isCollapsed ? "w-16" : "w-64")}>
      <div>
        <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100">
              <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-100 font-bold border border-zinc-700">CX</div>
              <span>Collabrix</span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-xs text-zinc-100 font-bold mx-auto border border-zinc-700">C</div>
          )}
        </div>

        <div className="p-3 space-y-6">
          <div className="space-y-1">
            {!isCollapsed && <p className="px-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Workspace</p>}
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group", isActive ? "bg-zinc-900 text-zinc-100 border border-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50")}>
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="p-3 border-t border-zinc-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-zinc-400">Connected</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 mx-auto transition-colors">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}