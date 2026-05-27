import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./routes";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TaskProvider } from "./context/TaskContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <TaskProvider>
              <RouterProvider router={router} />
            </TaskProvider>
          </NotificationProvider>
        </WorkspaceProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);