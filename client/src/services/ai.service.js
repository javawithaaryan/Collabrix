import api from "../lib/axios";

export const aiService = {
  generateTasks: async (prompt) => {
    const res = await api.post("/ai/generate-tasks", { prompt });
    return res.data;
  },

  generateSprint: async (prompt, projectId) => {
    const res = await api.post("/ai/generate-sprint", { prompt, projectId });
    return res.data;
  },

  runCodeReview: async (code, language) => {
    const res = await api.post("/ai/code-review", { code, language });
    return res.data;
  }
};
