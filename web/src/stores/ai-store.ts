import { create } from 'zustand'

interface TaskContext {
  id: string;
  title: string;
  description: string;
}

interface AiStore {
  isOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void

  // 2. Add the new context variables
  activeTask: TaskContext | null;
  setActiveTask: (task: TaskContext) => void;
  clearActiveTask: () => void;
}

export const useAiStore = create<AiStore>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

  // 3. Add the initial state and updater functions
  activeTask: null,
  setActiveTask: (task) => set({ activeTask: task, isOpen: true }), // Bonus: Automatically opens drawer when a task is set!
  clearActiveTask: () => set({ activeTask: null }),
}))