"use client"

import React, { useState } from "react"
import { Copy, Check, FileCode2 } from "lucide-react"
import { Snippet } from "@/types/snippet"
import { cn } from "@/lib/utils"

export function SnippetCard({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/30 hover:bg-zinc-900/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
      <div className="p-4 border-b border-zinc-800/50 flex items-start justify-between bg-zinc-950/30">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            {snippet.title}
          </h3>
          {snippet.description && (
            <p className="text-sm text-zinc-400 mt-1">{snippet.description}</p>
          )}
        </div>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-4 bg-[#0d0d12] overflow-x-auto custom-scrollbar">
        <pre className="text-sm text-zinc-300 font-mono">
          <code>{snippet.code}</code>
        </pre>
      </div>

      <div className="p-3 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-950/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            {snippet.language}
          </span>
          {snippet.tags.map(tag => (
            <span key={tag} className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white", snippet.author.color)}>
            {snippet.author.initials}
          </div>
          <span>Updated {snippet.updatedAt}</span>
        </div>
      </div>
    </div>
  )
}