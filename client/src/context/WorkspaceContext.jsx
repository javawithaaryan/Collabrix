import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { workspaceService } from "../services/workspace.service";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("member"); // owner, admin, member, viewer

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data || []);
    } catch (err) {
      console.error("Failed to load workspaces:", err.message);
    }
  }, [user]);

  const loadWorkspaceDetails = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const details = await workspaceService.getWorkspaceDetails(id);
      setActiveWorkspace(details);
      
      const currentUserId = user?.id || user?._id;
      const member = details.members?.find(
        (m) => (m.user?._id || m.user) === currentUserId
      );
      if (member) {
        setRole(member.role);
      } else if (details.owner?._id === currentUserId || details.owner === currentUserId) {
        setRole("owner");
      } else {
        setRole("member");
      }
    } catch (err) {
      console.error("Failed to load workspace details:", err.message);
      setActiveWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchWorkspace = useCallback((id) => {
    if (!id) {
      setActiveWorkspaceId(null);
      setActiveWorkspace(null);
      localStorage.removeItem("activeWorkspaceId");
      return;
    }
    localStorage.setItem("activeWorkspaceId", id);
    setActiveWorkspaceId(id);
  }, []);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
      const cachedId = localStorage.getItem("activeWorkspaceId");
      if (cachedId) {
        setActiveWorkspaceId(cachedId);
      }
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setActiveWorkspaceId(null);
      setRole("member");
    }
  }, [user, fetchWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadWorkspaceDetails(activeWorkspaceId);
    } else {
      setActiveWorkspace(null);
      setRole("member");
    }
  }, [activeWorkspaceId, loadWorkspaceDetails]);

  // Enforces user permission checks based on RBAC rules
  const can = useCallback((action) => {
    if (role === "owner") return true; // Owner can do everything
    
    switch (action) {
      case "delete_workspace":
      case "rename_workspace":
        return role === "owner";
      case "create_project":
      case "manage_invites":
      case "remove_members":
        return role === "owner" || role === "admin";
      case "create_task":
      case "edit_task":
      case "post_wiki":
      case "post_snippets":
        return role !== "viewer";
      case "chat":
      case "view_resources":
        return true; // All roles including viewer can view resources & chat
      default:
        return false;
    }
  }, [role]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        loading,
        role,
        fetchWorkspaces,
        switchWorkspace,
        loadWorkspaceDetails,
        can,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
export default WorkspaceContext;
