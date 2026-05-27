import { createBrowserRouter } from "react-router-dom";

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

import ProtectedRoute from "./components/ProtectedRoute";

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
    path: "/workspace/:id",
    element: (
      <ProtectedRoute>
        <Workspace />
      </ProtectedRoute>
    ),
  },

  {
    path: "/workspace/:id/resources",
    element: (
      <ProtectedRoute>
        <ResourceHub />
      </ProtectedRoute>
    ),
  },

  {
    path: "/workspace/:id/pulse",
    element: (
      <ProtectedRoute>
        <Pulse />
      </ProtectedRoute>
    ),
  },
  {
    path: "/workspace/:id/wiki",
    element: (
      <ProtectedRoute>
        <Wiki />
      </ProtectedRoute>
    ),
  },
  {
    path: "/workspace/:id/snippets",
    element: (
      <ProtectedRoute>
        <Snippets />
      </ProtectedRoute>
    ),
  },
  {
    path: "/workspace/:id/code-review",
    element: (
      <ProtectedRoute>
        <CodeReview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/workspace/:id/billing",
    element: (
      <ProtectedRoute>
        <Billing />
      </ProtectedRoute>
    ),
  },

  {
    path: "/project/:id",
    element: (
      <ProtectedRoute>
        <Project />
      </ProtectedRoute>
    ),
  },

  {
    path: "/join/:token",
    element: <JoinWorkspace />,
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;