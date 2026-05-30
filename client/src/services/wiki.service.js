import api from "../lib/axios";

export const wikiService = {
  getWorkspaceWikis: async (workspaceId) => {
    const res = await api.get(`/wiki/workspace/${workspaceId}`);
    return res.data;
  },

  getWikiById: async (wikiId) => {
    const res = await api.get(`/wiki/${wikiId}`);
    return res.data;
  },

  createWiki: async (payload) => {
    const res = await api.post("/wiki", payload);
    return res.data;
  },

  updateWiki: async (wikiId, payload) => {
    const res = await api.put(`/wiki/${wikiId}`, payload);
    return res.data;
  },

  deleteWiki: async (wikiId) => {
    const res = await api.delete(`/wiki/${wikiId}`);
    return res.data;
  },

  archiveWiki: async (wikiId) => {
    const res = await api.post(`/wiki/${wikiId}/archive`);
    return res.data;
  },

  restoreWiki: async (wikiId) => {
    const res = await api.post(`/wiki/${wikiId}/restore`);
    return res.data;
  },

  getWikiVersions: async (wikiId) => {
    const res = await api.get(`/wiki/${wikiId}/versions`);
    return res.data;
  },

  restoreWikiVersion: async (wikiId, versionNumber) => {
    const res = await api.post(`/wiki/${wikiId}/versions/restore`, { versionNumber });
    return res.data;
  },

  duplicateWiki: async (wikiId) => {
    const res = await api.post(`/wiki/${wikiId}/duplicate`);
    return res.data;
  },
};
