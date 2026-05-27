// Join workspace via invite link \u2014 public page, no sidebar
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";

export default function JoinWorkspace() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const res = await api.get(`/workspaces/invite/${token}`);
        setInfo(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired invite link");
      } finally {
        setLoading(false);
      }
    };
    fetchInviteInfo();
  }, [token]);

  const joinWorkspace = async () => {
    if (!user.id) {
      // Not logged in — redirect to login with return path
      localStorage.setItem("postLoginRedirect", `/join/${token}`);
      navigate("/login");
      return;
    }

    setJoining(true);
    setError("");
    try {
      const res = await api.post(`/workspaces/join/${token}`);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/workspace/${res.data.workspace._id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join workspace");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 w-full max-w-md shadow-2xl text-center">
        {/* Logo */}
        <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/40">
          <span className="text-2xl">⚡</span>
        </div>

        {error ? (
          <>
            <h1 className="text-xl font-extrabold text-white mb-3">Link Expired</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-5 py-2.5 rounded-xl transition"
            >
              ← Go Home
            </button>
          </>
        ) : success ? (
          <>
            <div className="text-3xl mb-4">🎉</div>
            <h1 className="text-xl font-extrabold text-white mb-2">You're in!</h1>
            <p className="text-zinc-500 text-sm">
              Joining <span className="text-zinc-300 font-bold">{info?.workspaceName}</span>...
            </p>
          </>
        ) : info?.expired ? (
          <>
            <h1 className="text-xl font-extrabold text-white mb-3">Invite Expired</h1>
            <p className="text-zinc-500 text-sm">Ask a teammate to generate a new invite link.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-5 py-2.5 rounded-xl transition"
            >
              ← Go Home
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-white mb-1">
              You're invited to join
            </h1>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mt-1 mb-5">
              {info?.workspaceName}
            </p>

            <div className="flex flex-col gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 mb-6 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Invited by</span>
                <span className="text-zinc-200 font-bold">{info?.ownerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Team size</span>
                <span className="text-zinc-200 font-bold">{info?.memberCount} member{info?.memberCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Your role</span>
                <span className="text-violet-400 font-bold capitalize">{info?.role || "member"}</span>
              </div>
            </div>

            {user.id ? (
              <button
                onClick={joinWorkspace}
                disabled={joining}
                className="w-full bg-white text-black py-3.5 rounded-2xl font-extrabold hover:bg-zinc-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Joining workspace...
                  </>
                ) : (
                  "Join Workspace →"
                )}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-zinc-500 text-xs">Log in to join this workspace</p>
                <button
                  onClick={() => { localStorage.setItem("postLoginRedirect", `/join/${token}`); navigate("/login"); }}
                  className="w-full bg-white text-black py-3.5 rounded-2xl font-extrabold hover:bg-zinc-100 transition"
                >
                  Log in to Join
                </button>
                <button
                  onClick={() => { localStorage.setItem("postLoginRedirect", `/join/${token}`); navigate("/register"); }}
                  className="w-full border border-zinc-800 text-zinc-300 py-3 rounded-2xl font-bold hover:border-zinc-700 hover:text-white transition text-sm"
                >
                  Create account instead
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-xs mt-3">⚠ {error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
