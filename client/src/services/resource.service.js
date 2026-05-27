import api from "../lib/axios";

export const resourceService = {
  getResources: async (workspaceId) => {
    const res = await api.get(`/resources/workspace/${workspaceId}`);
    return res.data;
  },

  createResource: async (resourceData) => {
    const res = await api.post("/resources", resourceData);
    return res.data;
  },

  updateResource: async (resourceId, updates) => {
    const res = await api.put(`/resources/${resourceId}`, updates);
    return res.data;
  },

  deleteResource: async (resourceId) => {
    const res = await api.delete(`/resources/${resourceId}`);
    return res.data;
  },

  toggleLike: async (resourceId) => {
    const res = await api.post(`/resources/${resourceId}/like`);
    return res.data;
  },

  addComment: async (resourceId, text) => {
    const res = await api.post(`/resources/${resourceId}/comment`, { text });
    return res.data;
  },

  attachToTask: async (resourceId, taskId) => {
    const res = await api.post(`/resources/${resourceId}/attach`, { taskId });
    return res.data;
  },

  extractMetadata: async (url) => {
    const res = await api.post("/resources/extract", { url });
    return res.data;
  },

  trackView: async (resourceId) => {
    const res = await api.post(`/resources/${resourceId}/view`);
    return res.data;
  },

  getRecommendations: async (workspaceId) => {
    const res = await api.get(`/resources/workspace/${workspaceId}/recommend`);
    return res.data;
  }
};
