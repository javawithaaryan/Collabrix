"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useBoardStore } from "@/stores/board-store"
import { Task } from "@/types/board"
import { BoardColumn } from "./board-column"
import { TaskCard } from "./task-card"

export function KanbanBoard() {
  const { columns, tasks, moveTask } = useBoardStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeTask = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)
    
    if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
      moveTask(activeId, overTask.columnId, overTask.position)
    }
    
    if (activeTask && !overTask) {
      const isOverColumn = columns.find((c) => c.id === overId)
      if (isOverColumn && activeTask.columnId !== overId) {
        moveTask(activeId, overId, tasks.filter(t => t.columnId === overId).length)
      }
    }
  }

  const onDragEnd = () => setActiveTask(null)

  if (!isMounted) return null // Prevents hydration mismatch errors

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.columnId === col.id).sort((a, b) => a.position - b.position)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}