import React from "react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Operational Space</h1>
        <p className="text-sm text-zinc-400">Realtime sync engine active. Select a feature to begin orchestration.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Active Tasks</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1">12</p>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Sprint Velocity</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1">94%</p>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Active Stream</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-2xl font-bold text-emerald-400">Live</p>
          </div>
        </div>
      </div>
    </div>
  )
}