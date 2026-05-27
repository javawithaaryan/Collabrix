import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useBoardStore } from "@/stores/board-store"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { moveTask } = useBoardStore()

  useEffect(() => {
    // 1. Connect to the Walkie-Talkie hub we just built
    const socketInstance = io("http://localhost:3001")
    setSocket(socketInstance)

    // 2. Listen for other people moving tasks
    socketInstance.on("task-moved", (data) => {
      // 3. When we hear a move, instantly update our own Zustand brain!
      moveTask(data.taskId, data.newColumnId, data.position)
    })

    // Cleanup when the user leaves the page
    return () => {
      socketInstance.disconnect()
    }
  }, [moveTask])

  return socket
}