import React from "react"
import { Sidebar } from "@/components/navigation/sidebar"
import { Navbar } from "@/components/navigation/navbar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-zinc-950/40">
          {children}
        </main>
      </div>
    </div>
  )
}