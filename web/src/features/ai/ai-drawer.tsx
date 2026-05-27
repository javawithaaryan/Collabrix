"use client"

import { X, Sparkles, Send } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useAiStore } from "@/stores/ai-store"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export function AiDrawer() {
  const { isOpen, closeDrawer } = useAiStore()
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Collabrix assistant. Ask me to summarize a task, generate boilerplate code, or explain a technical concept.",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const root = document.createElement("div")
    root.id = "collabrix-ai-drawer-portal"
    document.body.appendChild(root)
    setPortalRoot(root)

    return () => {
      if (root.parentElement) {
        root.parentElement.removeChild(root)
      }
    }
  }, [])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }]
    setMessages(nextMessages)
    setInput("")
    setIsSending(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmed, history: nextMessages }),
      })

      const payload = await response.json()
      const assistantContent =
        payload?.message || payload?.error || "I couldn't get a response from the AI."

      setMessages((current) => [
        ...current,
        { role: "assistant", content: assistantContent },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Something went wrong while contacting the AI. Please try again.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSend()
    }
  }

  if (!portalRoot) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />

      <div
        className={`absolute inset-y-0 right-0 w-full max-w-md sm:w-105 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-zinc-100 tracking-tight">Workflow AI</span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close AI drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-sm text-zinc-400">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-indigo-600/20 text-indigo-100 border border-indigo-500/20"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Message AI..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-4 pr-12 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-500"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="absolute right-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send AI prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalRoot,
  )
}
