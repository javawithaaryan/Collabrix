"use client"

import React from "react"

export function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex justify-center bg-zinc-950">
      {/* This max-w-4xl is the magic class that gives it the Notion-like 
        reading width instead of stretching across the entire monitor.
      */}
      <div className="w-full max-w-4xl h-full flex flex-col bg-zinc-950 border-x border-zinc-900/50 shadow-sm">
        {children}
      </div>
    </div>
  )
}