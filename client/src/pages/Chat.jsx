import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { projectService } from "../services/project.service";
import socket from "../socket";
import api from "../lib/axios";

// ─── Format Time ─────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateGroup(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

// ─── Static Channels ─────────────────────────────────────────────────────────
const STATIC_CHANNELS = [
  { id: "general", name: "general", icon: "💬", description: "General team discussions" },
  { id: "backend", name: "backend", icon: "⚙️", description: "Backend engineering & APIs" },
  { id: "frontend", name: "frontend", icon: "🎨", description: "Frontend, UI/UX discussions" },
  { id: "devops", name: "devops", icon: "🚀", description: "Infrastructure & deployments" },
  { id: "ai", name: "ai", icon: "✨", description: "AI tools & integrations" },
  { id: "random", name: "random", icon: "🎲", description: "Off-topic, fun stuff" },
];

// ─── Attachment Preview ──────────────────────────────────────────────────────
function AttachmentPreview({ text }) {
  if (!text) return null;

  const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
  const imageMatch = text.match(imageRegex);
  if (imageMatch) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-zinc-800 max-w-xs bg-zinc-950">
        <img src={imageMatch[1]} alt="Preview" className="w-full object-cover max-h-48" />
      </div>
    );
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlMatch = text.match(urlRegex);
  if (urlMatch) {
    const url = urlMatch[0];
    if (url.includes("localhost") || url.includes("onrender.com")) return null;
    const domain = url.replace(/https?:\/\//, "").split("/")[0];
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="mt-2 flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl max-w-xs hover:border-zinc-700 transition group"
      >
        <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-xs flex-shrink-0">🔗</div>
        <div className="min-w-0">
          <div className="text-[9px] text-zinc-500 uppercase font-mono">{domain}</div>
          <div className="text-[10px] text-zinc-300 truncate font-semibold group-hover:text-white transition">{url}</div>
        </div>
      </a>
    );
  }

  return null;
}

// ─── Mention Parser ──────────────────────────────────────────────────────────
function renderMentions(text, currentUserName) {
  if (!text) return text;
  let parsed = text.replace(/@(\w+)/g, (match, name) => {
    const isMe = name.toLowerCase() === currentUserName?.toLowerCase();
    return `<span class="inline-flex items-center px-1 py-0.5 rounded font-bold text-violet-400 ${isMe ? 'bg-violet-950/40 border border-violet-900/40' : ''} cursor-pointer hover:text-violet-300">${match}</span>`;
  });
  parsed = parsed.replace(/#([\w-]+)/g, (match) => {
    return `<span class="inline-flex items-center px-1 py-0.5 rounded font-bold text-amber-400 cursor-pointer hover:text-amber-300">${match}</span>`;
  });
  return parsed;
}

// ─── Thread Panel ─────────────────────────────────────────────────────────────
function ThreadPanel({ parentMessage, projectId, onClose, currentUser }) {
  const [replies, setReplies] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // For now show replies as empty - thread replies would need separate API
    setReplies([]);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [parentMessage?._id]);

  const sendReply = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await api.post("/messages", { project: projectId, text: `[Thread] ${trimmed}`, parentId: parentMessage._id });
      setReplies(prev => [...prev, res.data]);
      setText("");
      socket.emit("send-message", { projectId, message: res.data });
    } catch (err) { console.error("Failed to send reply", err); }
    finally { setSending(false); }
  };

  if (!parentMessage) return null;

  return (
    <div className="w-80 border-l border-zinc-900 flex flex-col bg-zinc-950/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <h3 className="text-xs font-bold text-white">Thread</h3>
        <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-white transition text-xs">✕</button>
      </div>
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/30">
        <div className="text-[10px] text-zinc-500 mb-1">{parentMessage.sender?.name || "Unknown"}</div>
        <div className="text-xs text-zinc-300">{parentMessage.text}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
        {replies.length === 0 && (
          <div className="text-center py-6 text-zinc-600 text-xs">No replies yet. Start the thread!</div>
        )}
        {replies.map(r => (
          <div key={r._id} className="text-xs text-zinc-300">
            <span className="font-bold text-zinc-400 mr-1">{r.sender?.name}:</span>{r.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-zinc-900 flex gap-2">
        <input
          type="text"
          placeholder="Reply to thread..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 transition"
        />
        <button
          onClick={sendReply}
          disabled={!text.trim() || sending}
          className="px-3 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition"
        >↵</button>
      </div>
    </div>
  );
}

// ─── Message Component ────────────────────────────────────────────────────────
function ChatMessage({ msg, isMe, isGrouped, userId, userName, onReaction, onThread, onPin }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = () => setShowPicker(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showPicker]);

  if (msg.isSystem) {
    const icons = { task_completed: "✓", ai_generated: "✨", resource_shared: "📔", sprint_generated: "🎯", wiki_created: "📖" };
    const colors = {
      task_completed: "text-emerald-400 border-emerald-900/30 bg-emerald-950/20",
      ai_generated: "text-violet-400 border-violet-900/30 bg-violet-950/20",
      resource_shared: "text-blue-400 border-blue-900/30 bg-blue-950/20",
      wiki_created: "text-amber-400 border-amber-900/30 bg-amber-950/20",
      default: "text-zinc-500 border-zinc-900/40 bg-zinc-900/20",
    };
    const icon = icons[msg.type] || "⚡";
    const color = colors[msg.type] || colors.default;
    return (
      <div className="flex justify-center my-2 select-none">
        <span className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-[9px] font-mono ${color}`}>
          <span>{icon}</span><span>{msg.text}</span>
        </span>
      </div>
    );
  }

  const isPinned = msg.isPinned;

  return (
    <div
      className={`flex flex-col relative group ${isMe ? "items-end" : "items-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowPicker(false); }}
    >
      {!isGrouped && (
        <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
            ["bg-violet-700", "bg-blue-700", "bg-emerald-700", "bg-amber-700", "bg-rose-700"][
              (msg.sender?.name?.charCodeAt(0) || 0) % 5
            ]
          }`}>
            {msg.sender?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {msg.sender?.name || "Unknown"} · {formatTime(msg.createdAt)}
          </span>
          {isPinned && <span className="text-[9px] text-amber-400 font-mono">📌 pinned</span>}
        </div>
      )}

      <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
        {/* Bubble */}
        <div
          className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words max-w-full ${
            msg._failed ? "bg-red-950/40 text-red-400 border border-red-900" :
            msg._temp ? "bg-zinc-900 text-zinc-500 opacity-60" :
            isMe ? "bg-white text-black font-medium rounded-tr-sm" :
            "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-sm"
          }`}
        >
          <span
            dangerouslySetInnerHTML={{ __html: renderMentions(msg.text, userName) }}
          />
        </div>

        {/* Action Buttons */}
        {showActions && !msg._temp && !msg._failed && (
          <div className={`flex items-center gap-0.5 flex-shrink-0 ${isMe ? "flex-row-reverse" : ""}`}>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowPicker(p => !p); }}
                className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white text-[10px] transition"
              >☺</button>
              {showPicker && (
                <div
                  ref={pickerRef}
                  onClick={e => e.stopPropagation()}
                  className={`absolute bottom-full mb-1 z-30 flex gap-1 p-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl ${isMe ? "right-0" : "left-0"}`}
                >
                  {["👍", "❤️", "🔥", "🚀", "👀", "💯", "😂", "🙌"].map(emoji => {
                    const hasReacted = msg.reactions?.find(r => r.emoji === emoji)?.users?.some(u => (u._id || u) === userId);
                    return (
                      <button
                        key={emoji}
                        onClick={() => { onReaction(msg._id, emoji); setShowPicker(false); }}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm hover:bg-zinc-800 transition ${hasReacted ? "bg-zinc-800 ring-1 ring-zinc-600" : ""}`}
                      >{emoji}</button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={() => onThread(msg)} className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white text-[10px] transition" title="Thread">💬</button>
            <button onClick={() => onPin(msg._id)} className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-amber-400 text-[10px] transition" title="Pin">📌</button>
          </div>
        )}
      </div>

      {/* Link Preview */}
      {!msg.isSystem && <AttachmentPreview text={msg.text} />}

      {/* Reactions */}
      {msg.reactions?.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
          {msg.reactions.map(r => {
            const hasReacted = r.users?.some(u => (u._id || u) === userId);
            return (
              <button
                key={r.emoji}
                onClick={() => onReaction(msg._id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition ${
                  hasReacted ? "bg-violet-950/40 border-violet-800 text-violet-300" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
                title={r.users?.map(u => u.name || "?").join(", ")}
              >
                <span>{r.emoji}</span>
                <span className="font-mono">{r.users?.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Thread indicator */}
      {msg.replyCount > 0 && (
        <button onClick={() => onThread(msg)} className="text-[9px] text-violet-400 hover:text-violet-300 mt-1 font-mono transition">
          {msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"} →
        </button>
      )}
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function Chat() {
  const { id: workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get("project");
  const activeChannel = searchParams.get("channel") || "general";

  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activePickerMsgId, setActivePickerMsgId] = useState(null);
  const [threadMsg, setThreadMsg] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [activeSection, setActiveSection] = useState("projects"); // "projects" | "channels"

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  const userName = user.name;

  // ── Load projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    projectService.getProjectsByWorkspace(workspaceId).then(data => {
      setProjects(data || []);
      if (data?.length > 0 && !activeProjectId) {
        setSearchParams({ project: data[0]._id, channel: "general" });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [workspaceId]);

  // ── Load messages ──────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeProjectId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/${activeProjectId}`);
      setMessages(res.data || []);
    } catch (err) { console.error("Failed to load messages:", err); }
    finally { setLoadingMsgs(false); }
  }, [activeProjectId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeProjectId) return;

    const onMessage = (msg) => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    const onReaction = ({ messageId, message }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? message : m));
    };
    const onTypingStart = ({ userName: n }) => {
      if (n === userName) return;
      setTypingUsers(prev => [...new Set([...prev, n])]);
    };
    const onTypingStop = ({ userName: n }) => {
      setTypingUsers(prev => prev.filter(u => u !== n));
    };

    socket.on("receive-message", onMessage);
    socket.on("receive-message-reaction", onReaction);
    socket.on("typing-start", onTypingStart);
    socket.on("typing-stop", onTypingStop);

    return () => {
      socket.off("receive-message", onMessage);
      socket.off("receive-message-reaction", onReaction);
      socket.off("typing-start", onTypingStart);
      socket.off("typing-stop", onTypingStop);
    };
  }, [activeProjectId, userName]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ── Typing indicators ──────────────────────────────────────────────────────
  const startTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing-start", { projectId: activeProjectId, userName });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing-stop", { projectId: activeProjectId, userName });
    }, 2000);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    socket.emit("typing-stop", { projectId: activeProjectId, userName });

    setSending(true);
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      text: trimmed,
      sender: { _id: userId, name: userName },
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setText("");

    try {
      const res = await api.post("/messages", { project: activeProjectId, text: trimmed });
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data : m));
      socket.emit("send-message", { projectId: activeProjectId, message: res.data });
    } catch (err) {
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...m, _failed: true } : m));
    } finally { setSending(false); }
  };

  // ── Reactions ──────────────────────────────────────────────────────────────
  const handleReaction = async (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m._id !== msgId) return m;
      let reactions = JSON.parse(JSON.stringify(m.reactions || []));
      const idx = reactions.findIndex(r => r.emoji === emoji);
      if (idx > -1) {
        const uIdx = reactions[idx].users.findIndex(u => (u._id || u) === userId);
        if (uIdx > -1) {
          reactions[idx].users.splice(uIdx, 1);
          if (reactions[idx].users.length === 0) reactions.splice(idx, 1);
        } else {
          reactions[idx].users.push({ _id: userId, name: userName });
        }
      } else {
        reactions.push({ emoji, users: [{ _id: userId, name: userName }] });
      }
      return { ...m, reactions };
    }));

    try {
      const res = await api.put(`/messages/${msgId}/reaction`, { emoji });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      socket.emit("message-reaction", { projectId: activeProjectId, messageId: msgId, message: res.data });
    } catch (err) { fetchMessages(); }
  };

  // ── Pin message ───────────────────────────────────────────────────────────
  const handlePin = (msgId) => {
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: !m.isPinned } : m));
    setPinnedMessages(prev => {
      const msg = messages.find(m => m._id === msgId);
      if (!msg) return prev;
      if (prev.some(m => m._id === msgId)) return prev.filter(m => m._id !== msgId);
      return [...prev, { ...msg, isPinned: true }];
    });
  };

  // ── Mention detection ─────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) startTyping();

    // Detect @ mention
    const lastWord = e.target.value.split(" ").pop();
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectProject = (projectId) => {
    setSearchParams({ project: projectId, channel: "general" });
  };

  const handleSelectChannel = (channelId) => {
    setSearchParams({ project: activeProjectId || "", channel: channelId });
  };

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length > 0
    ? `${typingUsers.join(", ")} are typing...`
    : null;

  // ── Group messages by date ────────────────────────────────────────────────
  const groupedMessages = [];
  let currentGroup = null;
  messages.forEach(msg => {
    const group = formatDateGroup(msg.createdAt);
    if (group !== currentGroup) {
      groupedMessages.push({ type: "date", label: group });
      currentGroup = group;
    }
    groupedMessages.push({ type: "message", data: msg });
  });

  const currentProject = projects.find(p => p._id === activeProjectId);
  const currentChannelMeta = STATIC_CHANNELS.find(c => c.id === activeChannel);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-zinc-950 text-white overflow-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.3); border-radius: 9999px; }
      `}</style>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div className="w-64 border-r border-zinc-900 flex flex-col flex-shrink-0 bg-zinc-950">
        {/* Workspace Header */}
        <div className="p-4 border-b border-zinc-900">
          <h2 className="text-xs font-extrabold text-white truncate">Collabrix Chat</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-zinc-500 font-mono">online</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-zinc-900 flex-shrink-0">
          <button
            onClick={() => setActiveSection("channels")}
            className={`flex-1 py-2 text-[10px] font-bold transition ${activeSection === "channels" ? "text-white border-b border-violet-500" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveSection("projects")}
            className={`flex-1 py-2 text-[10px] font-bold transition ${activeSection === "projects" ? "text-white border-b border-violet-500" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            Projects
          </button>
        </div>

        {/* Channels / Projects List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5 scrollbar-thin">
          {activeSection === "channels" ? (
            <>
              <div className="px-2 py-1 text-[9px] text-zinc-600 font-mono uppercase tracking-wider">Channels</div>
              {STATIC_CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition ${
                    activeChannel === ch.id && activeSection === "channels"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-sm">{ch.icon}</span>
                  <span># {ch.name}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="px-2 py-1 text-[9px] text-zinc-600 font-mono uppercase tracking-wider">Project Boards</div>
              {loading ? (
                <div className="py-4 text-center text-zinc-600 text-xs">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-xs px-3">
                  <p>No projects yet</p>
                  <p className="text-[9px] mt-1">Create a project to open a board channel</p>
                </div>
              ) : projects.map(proj => (
                <button
                  key={proj._id}
                  onClick={() => handleSelectProject(proj._id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition ${
                    proj._id === activeProjectId
                      ? "bg-zinc-800 text-white font-semibold border border-zinc-700"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-sm flex-shrink-0">🗂</span>
                  <span className="truncate">{proj.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* User Status */}
        <div className="p-3 border-t border-zinc-900 flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white bg-violet-700 flex-shrink-0`}>
            {userName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-300 truncate">{userName}</div>
            <div className="text-[9px] text-emerald-400 font-mono">● Active</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeProjectId || activeSection === "channels" ? (
          <>
            {/* Channel Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-zinc-950/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{activeSection === "channels" ? currentChannelMeta?.icon : "🗂"}</span>
                    <h3 className="text-sm font-bold text-white">
                      {activeSection === "channels"
                        ? `# ${activeChannel}`
                        : currentProject?.name || "Project Chat"
                      }
                    </h3>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {activeSection === "channels"
                      ? currentChannelMeta?.description
                      : currentProject?.description?.slice(0, 60) + "..." || "Project board channel"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPinned(!showPinned)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] border transition font-mono ${showPinned ? "bg-amber-950/40 border-amber-800 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                >
                  📌 {pinnedMessages.length > 0 ? pinnedMessages.length : ""} Pinned
                </button>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  live
                </div>
              </div>
            </div>

            {/* Pinned Messages Panel */}
            {showPinned && pinnedMessages.length > 0 && (
              <div className="border-b border-amber-900/30 bg-amber-950/10 px-5 py-3 max-h-32 overflow-y-auto scrollbar-thin">
                <div className="text-[9px] text-amber-400 font-mono uppercase tracking-wider mb-2">📌 Pinned Messages</div>
                {pinnedMessages.map(m => (
                  <div key={m._id} className="text-xs text-zinc-400 truncate py-0.5">
                    <span className="text-amber-400 font-bold mr-1">{m.sender?.name}:</span>{m.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0 scrollbar-thin">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12 text-zinc-600 text-xs">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-3xl mb-3">💬</div>
                    <h3 className="text-sm font-bold text-zinc-400">
                      {activeSection === "channels" ? `Start #${activeChannel}` : "Start the conversation"}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                      {activeSection === "channels"
                        ? `This is the beginning of #${activeChannel} channel`
                        : "Be the first to send a message in this project board"
                      }
                    </p>
                  </div>
                ) : groupedMessages.map((item, i) => {
                  if (item.type === "date") {
                    return (
                      <div key={`date-${i}`} className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-zinc-900" />
                        <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap">{item.label}</span>
                        <div className="flex-1 h-px bg-zinc-900" />
                      </div>
                    );
                  }
                  const msg = item.data;
                  const isMe = msg.sender?._id === userId || msg.sender === userId;
                  const prevItem = groupedMessages[i - 1];
                  const prevMsg = prevItem?.type === "message" ? prevItem.data : null;
                  const isGrouped = prevMsg && !prevMsg.isSystem && !msg.isSystem
                    && (prevMsg.sender?._id || prevMsg.sender) === (msg.sender?._id || msg.sender)
                    && new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 180000;

                  return (
                    <ChatMessage
                      key={msg._id}
                      msg={msg}
                      isMe={isMe}
                      isGrouped={isGrouped}
                      userId={userId}
                      userName={userName}
                      onReaction={handleReaction}
                      onThread={setThreadMsg}
                      onPin={handlePin}
                    />
                  );
                })}

                {/* Typing Indicator */}
                {typingText && (
                  <div className="flex items-center gap-2 mt-3 ml-1">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{typingText}</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Thread Panel */}
              {threadMsg && (
                <ThreadPanel
                  parentMessage={threadMsg}
                  projectId={activeProjectId}
                  onClose={() => setThreadMsg(null)}
                  currentUser={user}
                />
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 flex-shrink-0">
              {/* Mention Suggestions */}
              {mentionQuery && (
                <div className="mb-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex flex-col gap-1">
                  {["Aryan", "Bhoomi", "Viewer"].filter(n => n.toLowerCase().includes(mentionQuery.toLowerCase())).map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        setText(prev => prev.replace(/@\w*$/, `@${n} `));
                        setMentionQuery(null);
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-left text-xs text-zinc-300 transition"
                    >
                      <div className="w-5 h-5 bg-violet-700 rounded-full flex items-center justify-center text-[9px] font-bold text-white">{n[0]}</div>
                      @{n}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Message ${activeSection === "channels" ? `#${activeChannel}` : currentProject?.name || "project"}... (@ to mention)`}
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      if (e.key === "Escape") setMentionQuery(null);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-zinc-700 transition placeholder-zinc-600"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                  className="px-4 py-2.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
              <p className="text-[9px] text-zinc-700 mt-1.5 font-mono px-1">
                Enter to send · @ to mention · Shift+Enter for newline
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-sm font-bold text-zinc-300">Welcome to Collabrix Chat</h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-2">
              Select a channel or project from the sidebar to start collaborating with your team in real-time.
            </p>
            <button
              onClick={() => setActiveSection("channels")}
              className="mt-4 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition"
            >
              Browse Channels
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
