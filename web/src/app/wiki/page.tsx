"use client"

import React from "react"
import { Search, Plus } from "lucide-react"
import { useSnippetStore } from "@/stores/snippet-store"
import { SnippetCard } from "@/features/snippets/snippet-card"
import { WikiEditor } from "@/features/wiki/wiki-editor"



export default function SnippetsPage() {
  const { snippets, searchQuery, setSearchQuery } = useSnippetStore()

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Code Snippets</h1>
          <p className="text-sm text-zinc-400">Your team's production-ready component library.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm">
          <Plus className="w-4 h-4 text-indigo-200" />
          <span>New Snippet</span>
        </button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text"
          placeholder="Search by title or #tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        {filteredSnippets.map(snippet => (
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))}
      </div>
    </div>
  )
}