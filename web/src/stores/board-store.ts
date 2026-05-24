import { create } from "zustand"
import { Task, Column } from "@/types/board"

interface BoardState {
  columns: Column[]
  tasks: Task[]
  selectedTaskId: string | null // NEW: Tracks the open task panel
  
  // Actions
  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => void
  addTask: (task: Omit<Task, "id" | "commentsCount" | "position">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  setSelectedTask: (id: string | null) => void // NEW: Action to open/close panel
}

const defaultColumns: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "done", title: "Done" },
]

const initialTasks: Task[] = [
  {
    id: "t-1",
    columnId: "in-progress",
    title: "Configure Vite build environment",
    description: "Set up the initial Vite React environment and ensure the Tailwind architecture is completely decoupled from the legacy CSS files before ML integration.",
    priority: "high",
    labels: ["Infrastructure", "Frontend"],
    commentsCount: 3,
    position: 0,
    assignee: { id: "u-1", name: "Frontend Lead", initials: "FL", color: "bg-indigo-600" }
  },
  {
    id: "t-2",
    columnId: "todo",
    title: "Prepare frontend logic for AI/ML backend handoff",
    description: "Ensure the socket listeners are ready to receive the model data. The backend team needs the precise JSON schema for the payload.",
    priority: "urgent",
    labels: ["Integration", "AI"],
    commentsCount: 1,
    position: 0,
  },
  {
    id: "t-3",
    columnId: "in-review",
    title: "Implement FairTrace bias detection visuals",
    description: "Build the Recharts graphs to visualize the confidence scores from the bias autopsy engine.",
    priority: "medium",
    labels: ["UI/UX", "Feature"],
    commentsCount: 5,
    position: 0,
    assignee: { id: "u-2", name: "Data Engineer", initials: "DE", color: "bg-emerald-600" }
  }
]

export const useBoardStore = create<BoardState>((set) => ({
  columns: defaultColumns,
  tasks: initialTasks,
  selectedTaskId: null,

  moveTask: (taskId, targetColumnId, newPosition) => 
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, columnId: targetColumnId, position: newPosition }
        }
        return task
      })
      return { tasks: updatedTasks }
    }),

  addTask: (newTaskData) => 
    set((state) => {
      const newTask: Task = {
        ...newTaskData,
        id: `t-${Date.now()}`,
        commentsCount: 0,
        position: state.tasks.filter(t => t.columnId === newTaskData.columnId).length,
      }
      return { tasks: [...state.tasks, newTask] }
    }),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => 
        task.id === id ? { ...task, ...updates } : task
      )
    })),
    
  setSelectedTask: (id) => set({ selectedTaskId: id })
}))