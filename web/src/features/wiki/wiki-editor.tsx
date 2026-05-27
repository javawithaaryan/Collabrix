"use client"

import React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Bold, Italic, List, ListOrdered, CheckSquare, Quote, Heading2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function WikiEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Press '/' for commands, or start typing...",
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: `<h1>Engineering Architecture Specs</h1><p>Welcome to the central wiki. This is where we document our core systems, API contracts, and deployment pipelines.</p>`,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[500px]",
      },
    },
  })

  if (!editor) return null

  const MenuBar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 mb-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("heading", { level: 2 }) ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <Heading2 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("bold") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("italic") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("bulletList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("orderedList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <ListOrdered className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("taskList") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <CheckSquare className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("p-2 rounded-md hover:bg-zinc-800 transition-colors", editor.isActive("blockquote") ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}>
        <Quote className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 p-6 shadow-sm">
      <MenuBar />
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}