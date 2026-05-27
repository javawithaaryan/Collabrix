import api from "../lib/axios";

export const projectService = {
  getProjectsByWorkspace: async (workspaceId) => {
    const res = await api.get(`/projects/${workspaceId}`);
    return res.data;
  },

  createProject: async (name, description, workspaceId) => {
    const res = await api.post("/projects", { name, description, workspaceId });
    return res.data;
  }
};
