import api from "../lib/axios";

export const workspaceService = {
  getWorkspaces: async () => {
    const res = await api.get("/workspaces");
    return res.data;
  },

  getWorkspaceDetails: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}`);
    return res.data;
  },

  createWorkspace: async (name, description) => {
    const res = await api.post("/workspaces", { name, description });
    return res.data;
  },

  updateWorkspace: async (workspaceId, name, description) => {
    const res = await api.put(`/workspaces/${workspaceId}`, { name, description });
    return res.data;
  },

  deleteWorkspace: async (workspaceId) => {
    const res = await api.delete(`/workspaces/${workspaceId}`);
    return res.data;
  },

  getMembers: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/members`);
    return res.data;
  },

  removeMember: async (workspaceId, userId) => {
    const res = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return res.data;
  },

  getInvites: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/invites`);
    return res.data;
  },

  createInvite: async (workspaceId, email, role) => {
    const res = await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
    return res.data;
  },

  revokeInvite: async (workspaceId, token) => {
    const res = await api.delete(`/workspaces/${workspaceId}/invite/${token}`);
    return res.data;
  },

  resendInvite: async (workspaceId, token) => {
    const res = await api.post(`/workspaces/${workspaceId}/invite/${token}/resend`);
    return res.data;
  },

  joinWorkspace: async (token) => {
    const res = await api.post(`/workspaces/join/${token}`);
    return res.data;
  },

  getInviteInfo: async (token) => {
    const res = await api.get(`/workspaces/invite/${token}`);
    return res.data;
  }
};
