import { createBrowserRouter, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Project from "./pages/Project";
import NotFound from "./pages/NotFound";
import JoinWorkspace from "./pages/JoinWorkspace";
import ResourceHub from "./pages/ResourceHub";
import Pulse from "./pages/Pulse";
import Wiki from "./pages/Wiki";
import Snippets from "./pages/Snippets";
import CodeReview from "./pages/CodeReview";
import Billing from "./pages/Billing";

import Tasks from "./pages/Tasks";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import SprintPlanner from "./pages/SprintPlanner";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "/join/:token",
    element: <JoinWorkspace />,
  },

  {
    path: "/workspace/:id",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Workspace />,
      },
      {
        path: "projects",
        element: <Workspace />,
      },
      {
        path: "kanban",
        element: <Project />,
      },
      {
        path: "kanban/:projectId",
        element: <Project />,
      },
      {
        path: "tasks",
        element: <Tasks />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "chat/:projectId",
        element: <Chat />,
      },
      {
        path: "resources",
        element: <ResourceHub />,
      },
      {
        path: "pulse",
        element: <Pulse />,
      },
      {
        path: "wiki",
        element: <Wiki />,
      },
      {
        path: "snippets",
        element: <Snippets />,
      },
      {
        path: "code-review",
        element: <CodeReview />,
      },
      {
        path: "billing",
        element: <Billing />,
      },
      {
        path: "activity",
        element: <Activity />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "sprint-planner",
        element: <SprintPlanner />,
      },
    ],
  },

  {
    path: "/project/:id",
    element: (
      <ProtectedRoute>
        <Navigate to={`/workspace/active/kanban/:id`} replace />
      </ProtectedRoute>
    ),
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;