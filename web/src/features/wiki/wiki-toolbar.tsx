"use client"

import { Editor } from "@tiptap/react"
import { Bold, Italic, List, ListOrdered, CheckSquare, Quote, Heading2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WikiToolbarProps {
  editor: Editor | null
}

export function WikiToolbar({ editor }: WikiToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 mb-4 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("heading", { level: 2 }) ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("bold") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("italic") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-zinc-800 mx-1" />
      
      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("bulletList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <List className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("orderedList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleTaskList().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("taskList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <CheckSquare className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-zinc-800 mx-1" />
      
      <button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("blockquote") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
      >
        <Quote className="w-4 h-4" />
      </button>
    </div>
  )
}