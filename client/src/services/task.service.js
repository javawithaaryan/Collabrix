import api from "../lib/axios";

export const taskService = {
  getTasksByProject: async (projectId) => {
    const res = await api.get(`/tasks/${projectId}`);
    return res.data;
  },

  getTasksByWorkspace: async (workspaceId) => {
    const res = await api.get(`/tasks/workspace/${workspaceId}`);
    return res.data;
  },

  createTask: async (taskData) => {
    const res = await api.post("/tasks", taskData);
    return res.data;
  },

  updateTask: async (taskId, updates) => {
    const res = await api.put(`/tasks/${taskId}`, updates);
    return res.data;
  },

  getComments: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data;
  },

  addComment: async (taskId, text) => {
    const res = await api.post(`/tasks/${taskId}/comments`, { text });
    return res.data;
  }
};
