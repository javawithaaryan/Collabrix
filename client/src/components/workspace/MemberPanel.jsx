import { useState, useEffect } from "react";
import api from "../../lib/axios";
import Avatar from "../ui/Avatar";
import socket from "../../socket";

const ROLE_BADGES = {
  owner: "bg-violet-950/50 text-violet-300 border-violet-800/40",
  admin: "bg-blue-950/40 text-blue-300 border-blue-800/40",
  member: "bg-zinc-900 text-zinc-400 border-zinc-800",
};

export default function MemberPanel({ workspaceId, currentUserId, onlineUserIds = [] }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteExpires, setInviteExpires] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to load members:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/invite`);
      setInviteToken(res.data.token);
      setInviteExpires(res.data.expiresAt);
    } catch (err) {
      console.error("Failed to generate invite:", err.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join/${inviteToken}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const removeMember = async (userId) => {
    if (!confirm("Remove this teammate from the workspace?")) return;
    setRemoving(userId);
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user._id !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err.message);
    } finally {
      setRemoving(null);
    }
  };

  const myRole = members.find((m) => m.user?._id === user.id)?.role || "member";
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">👥</span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Team</h2>
          <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full ml-1">
            {members.length}
          </span>
        </div>
        <button
          onClick={generateInviteLink}
          disabled={generatingLink}
          className="text-[10px] font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          {generatingLink ? (
            <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          ) : (
            "＋ Invite"
          )}
        </button>
      </div>

      {/* Invite link panel */}
      {inviteToken && (
        <div className="px-5 py-3 bg-violet-950/20 border-b border-violet-900/20">
          <p className="text-[10px] text-violet-400 font-bold mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            Invite link ready — valid 7 days
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${window.location.origin}/join/${inviteToken}`}
              className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-[10px] text-zinc-400 font-mono outline-none select-all"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition ${
                copied
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-600 text-xs py-4">
            <span className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin" />
            Loading teammates...
          </div>
        ) : members.length === 0 ? (
          <p className="text-zinc-700 text-xs italic py-4">No members yet.</p>
        ) : (
          members.map((member) => {
            const isOnline = onlineUserIds.includes(member.user?._id);
            const isMe = member.user?._id === user.id;

            return (
              <div
                key={member.user?._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-zinc-900/40 transition group"
              >
                <div className="relative flex-shrink-0">
                  <Avatar alt={member.user?.name || "?"} size="sm" />
                  <span
                    className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950 ${
                      isOnline ? "bg-emerald-400" : "bg-zinc-700"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {member.user?.name || "Unknown"}
                      {isMe && <span className="text-zinc-600 font-normal"> (you)</span>}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-600 truncate">{member.user?.email}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      ROLE_BADGES[member.role] || ROLE_BADGES.member
                    }`}
                  >
                    {member.role}
                  </span>

                  {canManage && !isMe && member.role !== "owner" && (
                    <button
                      onClick={() => removeMember(member.user._id)}
                      disabled={removing === member.user._id}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition text-[10px] px-1"
                      title="Remove from workspace"
                    >
                      {removing === member.user._id ? "..." : "✕"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
