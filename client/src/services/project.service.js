import api from "../lib/axios";

export const projectService = {
  getProjectsByWorkspace: async (workspaceId) => {
    const res = await api.get(`/projects/${workspaceId}`);
    return res.data;
  },

  createProject: async (name, description, workspaceId) => {
    const res = await api.post("/projects", { name, description, workspaceId });
    return res.data;
  },

  updateProject: async (projectId, data) => {
    const res = await api.put(`/projects/${projectId}`, data);
    return res.data;
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  }
};
