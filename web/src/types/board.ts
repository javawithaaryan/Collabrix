export type Priority = "low" | "medium" | "high" | "urgent"

export interface User {
  id: string
  name: string
  avatar?: string
  initials: string
  color: string // For the UI avatar background (e.g., "bg-indigo-500")
}

export interface Task {
  id: string
  columnId: string // The current status/column
  title: string
  description?: string
  priority: Priority
  assignee?: User
  labels: string[]
  dueDate?: string
  commentsCount: number
  position: number // Crucial for maintaining drag-and-drop order
}

export interface Column {
  id: string
  title: string
}