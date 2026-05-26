import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

import axios from "../lib/axios";

import socket from "../socket";

import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import ActivityPanel from "../components/ActivityPanel";

const Project = () => {
  const { id } = useParams();

  const [tasks, setTasks] = useState([]);

  const [activities, setActivities] = useState([]);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const createTask = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/tasks",
        {
          title,
          description,
          project: id,
          priority: "medium",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("task-updated", {
        projectId: id,
        message: `${user.name} created a task`,
      });

      setTitle("");
      setDescription("");

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `/tasks/${taskId}`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("task-updated", {
        projectId: id,
        message: `${user.name} moved a task to ${status}`,
      });

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;

    const newStatus = result.destination.droppableId;

    await updateTaskStatus(taskId, newStatus);
  };

  const groupedTasks = {
    todo: tasks.filter((task) => task.status === "todo"),

    "in-progress": tasks.filter(
      (task) => task.status === "in-progress"
    ),

    done: tasks.filter((task) => task.status === "done"),
  };

  useEffect(() => {
    fetchTasks();

    socket.emit("join-project", {
      projectId: id,
      user,
    });

    socket.on("receive-task-update", () => {
      fetchTasks();
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("activity", (activity) => {
      setActivities((prev) => [
        activity,
        ...prev,
      ]);
    });

    return () => {
      socket.off("receive-task-update");
      socket.off("online-users");
      socket.off("activity");
    };
  }, []);

  const renderColumn = (
    title,
    columnId,
    columnTasks
  ) => (
    <Droppable droppableId={columnId}>
      {(provided) => (
        <div
          className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 min-h-[600px]"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h2 className="text-2xl font-bold mb-5">
            {title}
          </h2>

          <div className="flex flex-col gap-4">
            {columnTasks.map((task, index) => (
              <Draggable
                key={task._id}
                draggableId={task._id}
                index={index}
              >
                {(provided) => (
                  <div
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <h3 className="text-xl font-semibold">
                      {task.title}
                    </h3>

                    <p className="text-zinc-400 mt-3">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between mt-5">
                      <span className="text-sm text-zinc-500">
                        {task.priority}
                      </span>

                      <span className="text-sm text-zinc-500">
                        {task.status}
                      </span>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-5xl font-bold mb-10">
          Project Board
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none h-28"
            />

            <button
              onClick={createTask}
              className="bg-white text-black py-3 rounded-xl font-semibold"
            >
              Create Task
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid xl:grid-cols-5 gap-6">
            {renderColumn(
              "Todo",
              "todo",
              groupedTasks.todo
            )}

            {renderColumn(
              "In Progress",
              "in-progress",
              groupedTasks["in-progress"]
            )}

            {renderColumn(
              "Done",
              "done",
              groupedTasks.done
            )}

            <div className="h-[80vh]">
              <ChatPanel projectId={id} />
            </div>

            <div className="h-[80vh]">
              <ActivityPanel
                activities={activities}
                onlineUsers={onlineUsers}
              />
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Project;