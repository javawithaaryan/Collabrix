import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { workspaceService } from "../services/workspace.service";
import { useNotifications } from "../context/NotificationContext";

export default function Settings() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace, role, can, fetchWorkspaces, loadWorkspaceDetails } = useWorkspace();
  const { triggerToast } = useNotifications();

  const [activeTab, setActiveTab] = useState("general");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name || "");
      setWorkspaceDesc(activeWorkspace.description || "");
    }
  }, [activeWorkspace]);

  const fetchInvites = async () => {
    if (!workspaceId) return;
    setLoadingInvites(true);
    try {
      const data = await workspaceService.getPendingInvites(workspaceId);
      setInvites(data || []);
    } catch (err) {
      console.error("Failed to load invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (activeTab === "invites") {
      fetchInvites();
    }
  }, [activeTab, workspaceId]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim() || saving) return;

    setSaving(true);
    try {
      await workspaceService.updateWorkspace(workspaceId, {
        name: workspaceName.trim(),
        description: workspaceDesc.trim(),
      });
      await loadWorkspaceDetails(workspaceId);
      await fetchWorkspaces();
      triggerToast("Workspace settings saved successfully!", "✓");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Failed to update settings", "🚨");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmation = window.confirm(
      "CAUTION: Are you absolutely sure you want to delete this workspace? This action is permanent and deletes all boards, chat histories, resources, and documents."
    );
    if (!confirmation) return;

    try {
      await workspaceService.deleteWorkspace(workspaceId);
      triggerToast("Workspace deleted successfully", "🗑️");
      await fetchWorkspaces();
      navigate("/dashboard");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Failed to delete workspace", "🚨");
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      await workspaceService.createInvite(workspaceId, inviteEmail, inviteRole);
      triggerToast(`Invite generated for ${inviteEmail || "new member"}!`, "✉️");
      setInviteEmail("");
      fetchInvites();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Failed to create invite", "🚨");
    }
  };

  const handleRevokeInvite = async (token) => {
    try {
      await workspaceService.revokeInvite(workspaceId, token);
      triggerToast("Invite link revoked", "✕");
      fetchInvites();
    } catch (err) {
      triggerToast("Failed to revoke invite", "🚨");
    }
  };

  const handleResendInvite = async (token) => {
    try {
      await workspaceService.resendInvite(workspaceId, token);
      triggerToast("Invite link refreshed and resent!", "🔄");
      fetchInvites();
    } catch (err) {
      triggerToast("Failed to refresh invite", "🚨");
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    const confirmRemove = window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`);
    if (!confirmRemove) return;

    try {
      await workspaceService.removeMember(workspaceId, userId);
      triggerToast(`${memberName} removed from workspace`, "✕");
      loadWorkspaceDetails(workspaceId);
    } catch (err) {
      triggerToast(err.response?.data?.message || "Failed to remove member", "🚨");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Workspace Administration
        </h1>
        <p className="text-slate-500 text-xs font-mono mt-1">
          Configure general details, member accessibility, and workspace invitations.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-900 pb-px space-x-6">
        {["general", "members", "invites"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
              activeTab === t
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t} settings
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === "general" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-350">General Customization</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!can("rename_workspace")}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-slate-700 transition text-xs text-white disabled:opacity-50"
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Workspace Description
                </label>
                <textarea
                  value={workspaceDesc}
                  onChange={(e) => setWorkspaceDesc(e.target.value)}
                  disabled={!can("rename_workspace")}
                  rows={3}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none resize-none focus:border-slate-700 transition text-xs text-white disabled:opacity-50"
                  placeholder="Describe your team's operational scope..."
                />
              </div>

              {can("rename_workspace") && (
                <button
                  type="submit"
                  disabled={saving || !workspaceName.trim()}
                  className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Customization"}
                </button>
              )}
            </form>

            {/* Danger Zone */}
            {can("delete_workspace") && (
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <h4 className="text-xs font-extrabold text-red-400 uppercase tracking-wider font-mono">Danger Zone</h4>
                <div className="bg-red-950/5 border border-red-955/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="text-xs leading-relaxed max-w-lg">
                    <p className="text-red-400 font-bold">Delete this workspace</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 leading-normal">
                      Once deleted, all projects, repositories, code snippets, documentation wikis and chats will be unrecoverable.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteWorkspace}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Delete Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-350">Workspace Teammates</h3>
              <span className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-mono">
                {activeWorkspace?.members?.length || 1} Total
              </span>
            </div>

            <div className="divide-y divide-slate-850/50">
              {activeWorkspace?.members?.map((m) => (
                <div key={m.user?._id || m.user} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-850 border border-indigo-500/20 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {m.user?.avatar ? (
                        <img src={m.user.avatar} alt={m.user.name} className="w-full h-full object-cover" />
                      ) : (
                        m.user?.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{m.user?.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{m.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                      {m.role || "member"}
                    </span>

                    {/* Member removal actions */}
                    {can("remove_members") &&
                      m.role !== "owner" &&
                      activeWorkspace.owner?._id !== (m.user?._id || m.user) && (
                        <button
                          onClick={() => handleRemoveMember(m.user?._id || m.user, m.user?.name || "Teammate")}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "invites" && (
          <div className="space-y-6">
            {/* Create Invite */}
            {can("manage_invites") && (
              <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-350">Generate Invitation</h3>
                <form onSubmit={handleCreateInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter email address (optional)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-slate-700 transition text-xs text-white placeholder-slate-700"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="member">Role: Member</option>
                    <option value="admin">Role: Admin</option>
                    <option value="viewer">Role: Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow shadow-indigo-600/10 cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </form>
              </div>
            )}

            {/* Invites Ledger */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-350">Pending Invitations Ledger</h3>
              {loadingInvites ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                  Fetching ledger...
                </div>
              ) : invites.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No active pending invitations found.
                </div>
              ) : (
                <div className="divide-y divide-slate-850/50">
                  {invites.map((inv) => (
                    <div key={inv._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          {inv.email || "Anyone with invitation token"}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                          Token: {inv.token}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                          {inv.role}
                        </span>

                        {can("manage_invites") && (
                          <div className="flex items-center gap-3 font-mono text-[10px]">
                            <button
                              onClick={() => handleResendInvite(inv.token)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Refresh
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(inv.token)}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
