import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../lib/axios";
import socket from "../../socket";

// Formats a date into a human-readable time string
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({ projectId, parentTypingUsers = [] }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activePickerMsgId, setActivePickerMsgId] = useState(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchMessages = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await api.get(`/messages/${projectId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages:", err.message);
      setLoadError(true);
    }
  }, [projectId]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Stop typing indicator before sending
    stopTyping();

    setSending(true);
    // Optimistic message for instant feedback
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      text: trimmed,
      sender: { _id: user.id || user._id, name: user.name },
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setText("");

    try {
      const res = await api.post("/messages", {
        project: projectId,
        text: trimmed,
      });

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? res.data : m))
      );

      socket.emit("send-message", { projectId, message: res.data });
    } catch (err) {
      console.error("Failed to send message:", err.message);
      // Mark the temp message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempMsg._id ? { ...m, _failed: true } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Reactions ─────────────────────────────────────────────────────
  const handleToggleReaction = async (messageId, emoji) => {
    const userId = user.id || user._id;
    const userName = user.name || "Someone";

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id !== messageId) return m;

        let reactions = m.reactions ? JSON.parse(JSON.stringify(m.reactions)) : [];
        const reactIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (reactIndex > -1) {
          const usersList = reactions[reactIndex].users;
          const userIndex = usersList.findIndex((u) => (u._id || u) === userId);

          if (userIndex > -1) {
            usersList.splice(userIndex, 1);
            if (usersList.length === 0) {
              reactions.splice(reactIndex, 1);
            }
          } else {
            usersList.push({ _id: userId, name: userName });
          }
        } else {
          reactions.push({
            emoji,
            users: [{ _id: userId, name: userName }],
          });
        }

        return { ...m, reactions };
      })
    );

    try {
      const res = await api.put(`/messages/${messageId}/reaction`, { emoji });
      // Replace with real updated message from server
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? res.data : m))
      );
      // Broadcast via socket
      socket.emit("message-reaction", {
        projectId,
        messageId,
        message: res.data,
      });
    } catch (err) {
      console.error("Failed to toggle reaction:", err.message);
      fetchMessages();
    }
  };

  // Click outside to close emoji picker
  useEffect(() => {
    if (!activePickerMsgId) return;
    const handleDocumentClick = () => {
      setActivePickerMsgId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [activePickerMsgId]);

  // ─── Typing indicators ─────────────────────────────────────────────
  const startTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing-start", { projectId, userName: user.name });
    }
    // Reset the stop timer
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing-stop", { projectId, userName: user.name });
    }
    clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // ─── Socket listeners ──────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();

    const onMessage = (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        return exists ? prev : [...prev, message];
      });
    };

    const onMessageReaction = ({ messageId, message }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? message : m))
      );
    };

    const onPresenceStatus = ({ name, type }) => {
      if (name === user.name) return; // ignore self system messages
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys-${Date.now()}-${Math.random()}`,
          text: `${name} ${type === "join" ? "joined the sprint board" : "left the sprint board"}`,
          isSystem: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    const onActivityNew = (activity) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys-${Date.now()}-${Math.random()}`,
          text: activity.message,
          type: activity.type,
          isSystem: true,
          createdAt: activity.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const onConnect = () => {
      fetchMessages();
    };

    socket.on("receive-message", onMessage);
    socket.on("receive-message-reaction", onMessageReaction);
    socket.on("presence-status", onPresenceStatus);
    socket.on("activity:new", onActivityNew);
    socket.on("connect", onConnect);

    return () => {
      socket.off("receive-message", onMessage);
      socket.off("receive-message-reaction", onMessageReaction);
      socket.off("presence-status", onPresenceStatus);
      socket.off("activity:new", onActivityNew);
      socket.off("connect", onConnect);
      stopTyping();
      clearTimeout(typingTimeoutRef.current);
    };

  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, parentTypingUsers]);

  const typingText =
    parentTypingUsers.length === 1
      ? `${parentTypingUsers[0]} is typing...`
      : parentTypingUsers.length > 2
      ? "Multiple people are typing..."
      : parentTypingUsers.length > 0
      ? `${parentTypingUsers.join(" and ")} are typing...`
      : null;

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden hover:border-zinc-800 transition">
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-chat-in {
          animation: chatFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">💬</span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">
            Team Chat
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-thin">
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
            <p className="text-zinc-600 text-xs">Couldn't load messages.</p>
            <button
              onClick={fetchMessages}
              className="text-zinc-400 text-xs underline hover:text-zinc-300"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <span className="text-2xl mb-2">💬</span>
            <p className="text-zinc-600 text-xs">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : null}

        {messages.map((msg, index) => {
          const userId = user.id || user._id;
          const isMe = msg.sender?._id === userId || msg.sender === userId || (msg.sender && (msg.sender._id === userId || msg.sender === userId));
          const prevMsg = index > 0 ? messages[index - 1] : null;

          // Group messages from same sender within 3 minutes
          const isGrouped =
            prevMsg &&
            !prevMsg.isSystem &&
            (prevMsg.sender?._id || prevMsg.sender) === (msg.sender?._id || msg.sender) &&
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 180000;

          if (msg.isSystem) {
            let icon = "⚡";
            let colorClass = "text-zinc-500 bg-zinc-900/30 border-zinc-900/60";
            if (msg.type === "task_completed") {
              icon = "✓";
              colorClass = "text-emerald-400 bg-emerald-950/20 border-emerald-900/30";
            } else if (msg.type === "ai_generated") {
              icon = "✨";
              colorClass = "text-violet-400 bg-violet-950/20 border-violet-900/30";
            } else if (msg.type === "resource_shared" || msg.type === "collection_created") {
              icon = "📔";
              colorClass = "text-indigo-400 bg-indigo-950/20 border-indigo-900/30";
            }
            return (
              <div key={msg._id} className="flex justify-center my-1.5 select-none animate-chat-in font-mono text-[9px] tracking-tight">
                <span className={`flex items-center gap-1.5 border rounded-full px-3 py-1 shadow-sm ${colorClass}`}>
                  <span>{icon}</span>
                  <span>{msg.text}</span>
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              className={`flex flex-col relative group animate-chat-in ${isMe ? "items-end" : "items-start"} ${
                isGrouped ? "-mt-0.5" : "mt-2.5"
              }`}
            >
              {!isGrouped && (
                <span className="text-zinc-550 text-[10px] mb-1 font-mono px-1">
                  {msg.sender?.name || "Unknown"} · {formatTime(msg.createdAt)}
                </span>
              )}
              
              <div className={`flex items-center gap-2 max-w-[90%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`px-3 py-1.5 rounded-2xl text-xs break-words leading-relaxed ${
                    msg._failed
                      ? "bg-red-950/40 text-red-400 border border-red-900/40 font-medium"
                      : msg._temp
                      ? "bg-zinc-900 text-zinc-500 border border-zinc-800 opacity-60"
                      : isMe
                      ? `bg-white text-black font-semibold rounded-tr-sm shadow-sm ${
                          isGrouped ? "rounded-br-sm" : ""
                        }`
                      : `bg-zinc-900/90 text-zinc-200 border border-zinc-850 rounded-tl-sm shadow-sm ${
                          isGrouped ? "rounded-bl-sm" : ""
                        }`
                  }`}
                >
                  {msg.text}
                  {msg._failed && (
                    <span className="block text-[9px] mt-0.5 opacity-60">Failed to send</span>
                  )}
                </div>

                {/* Reaction Picker Button */}
                {!msg._temp && !msg._failed && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePickerMsgId(activePickerMsgId === msg._id ? null : msg._id);
                      }}
                      className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[11px] transition shadow"
                      title="Add reaction"
                    >
                      ☺
                    </button>
                    
                    {/* Popover */}
                    {activePickerMsgId === msg._id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute bottom-full mb-1.5 z-20 flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl ${
                          isMe ? "right-0" : "left-0"
                        }`}
                      >
                        {["👍", "❤️", "🔥", "🚀", "👀"].map((emoji) => {
                          const reactions = msg.reactions || [];
                          const reactGroup = reactions.find((r) => r.emoji === emoji);
                          const hasReacted = reactGroup?.users.some((u) => (u._id || u) === userId);
                          return (
                            <button
                              key={emoji}
                              onClick={() => {
                                handleToggleReaction(msg._id, emoji);
                                setActivePickerMsgId(null);
                              }}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm hover:bg-zinc-800 transition ${
                                hasReacted ? "bg-zinc-850 border border-zinc-750 font-bold scale-105" : ""
                              }`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reactions Pill Badges */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 px-1 max-w-[85%] ${isMe ? "justify-end" : "justify-start"}`}>
                  {msg.reactions.map((r) => {
                    const hasReacted = r.users.some((u) => (u._id || u) === userId);
                    const userNames = r.users.map((u) => u.name || "Someone").join(", ");
                    return (
                      <button
                        key={r.emoji}
                        onClick={() => handleToggleReaction(msg._id, r.emoji)}
                        className={`group/pill relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition ${
                          hasReacted
                            ? "bg-zinc-800 text-zinc-200 border-zinc-650 hover:bg-zinc-750"
                            : "bg-zinc-900/60 text-zinc-400 border-zinc-850 hover:bg-zinc-850 hover:text-zinc-200"
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-mono text-[9px]">{r.users.length}</span>
                        
                        {/* Tooltip on hover */}
                        <span className="absolute bottom-full mb-1.5 hidden group-hover/pill:block bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 rounded text-[9px] font-sans whitespace-nowrap z-30 shadow-lg shadow-black/80">
                          {userNames}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {typingText && (
          <div className="flex items-center gap-2 mt-2 self-start bg-zinc-900 border border-zinc-850/60 rounded-2xl rounded-tl-sm px-4 py-2 text-zinc-400 text-[11px] font-sans shadow-sm animate-pulse">
            <span className="flex items-center gap-0.5 mr-1">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span>{typingText}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/20 flex gap-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Send a message..."
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-zinc-700 transition text-white"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
