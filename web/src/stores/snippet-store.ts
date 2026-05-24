import { create } from "zustand"
import { Snippet } from "@/types/snippet"

interface SnippetState {
  snippets: Snippet[]
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const initialSnippets: Snippet[] = [
  {
    id: "s-1",
    title: "Axios JWT Interceptor",
    description: "Automatically attaches the bearer token to all outgoing API requests.",
    code: `import axios from 'axios';\n\naxios.interceptors.request.use(\n  (config) => {\n    const token = localStorage.getItem('token');\n    if (token) config.headers.Authorization = \`Bearer \${token}\`;\n    return config;\n  },\n  (error) => Promise.reject(error)\n);`,
    language: "TypeScript",
    tags: ["API", "Auth", "Security"],
    author: { name: "Backend Lead", initials: "BL", color: "bg-purple-600" },
    updatedAt: "2 hours ago"
  },
  {
    id: "s-2",
    title: "Tailwind Gradient Text",
    description: "A quick utility class combo for animated gradient text.",
    code: `<h1 className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400 animate-pulse">\n  Hello World\n</h1>`,
    language: "TSX",
    tags: ["UI", "Tailwind", "CSS"],
    author: { name: "Frontend Lead", initials: "FL", color: "bg-indigo-600" },
    updatedAt: "1 day ago"
  }
]

export const useSnippetStore = create<SnippetState>((set) => ({
  snippets: initialSnippets,
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}))