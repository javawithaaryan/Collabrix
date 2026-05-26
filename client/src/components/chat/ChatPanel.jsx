import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../lib/axios";
import socket from "../../socket";

// Formats a date into a human-readable time string
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState([]);
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
      sender: { _id: user.id, name: user.name },
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

    const onTyping = ({ userName, isTyping }) => {
      if (userName === user.name) return; // don't show own indicator
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(userName)) return [...prev, userName];
        if (!isTyping) return prev.filter((n) => n !== userName);
        return prev;
      });
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

    const onConnect = () => {
      fetchMessages();
    };

    socket.on("receive-message", onMessage);
    socket.on("user-typing", onTyping);
    socket.on("presence-status", onPresenceStatus);
    socket.on("connect", onConnect);

    return () => {
      socket.off("receive-message", onMessage);
      socket.off("user-typing", onTyping);
      socket.off("presence-status", onPresenceStatus);
      socket.off("connect", onConnect);
      stopTyping();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length > 1
      ? `${typingUsers.slice(0, -1).join(", ")} and ${typingUsers.at(-1)} are typing...`
      : null;

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden hover:border-zinc-800 transition">
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 scrollbar-thin">
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
          const isMe = msg.sender?._id === user.id || msg.sender === user.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;

          // Group messages from same sender within 3 minutes
          const isGrouped =
            prevMsg &&
            (prevMsg.sender?._id || prevMsg.sender) === (msg.sender?._id || msg.sender) &&
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 180000;

          if (msg.isSystem) {
            return (
              <div key={msg._id} className="flex justify-center my-1.5 select-none">
                <span className="text-[10px] text-zinc-500 bg-zinc-900/25 border border-zinc-900/50 rounded-full px-3 py-1 font-sans">
                  ⚡ {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                isGrouped ? "-mt-1" : "mt-2.5"
              }`}
            >
              {!isGrouped && (
                <span className="text-zinc-500 text-[10px] mb-1 font-mono px-1">
                  {msg.sender?.name || "Unknown"} · {formatTime(msg.createdAt)}
                </span>
              )}
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${
                  msg._failed
                    ? "bg-red-950/40 text-red-400 border border-red-900/40"
                    : msg._temp
                    ? "bg-zinc-800 text-zinc-400 border border-zinc-700 opacity-70"
                    : isMe
                    ? `bg-white text-black font-semibold rounded-tr-sm shadow-sm ${
                        isGrouped ? "rounded-br-sm" : ""
                      }`
                    : `bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-tl-sm ${
                        isGrouped ? "rounded-bl-sm" : ""
                      }`
                }`}
              >
                {msg.text}
                {msg._failed && (
                  <span className="block text-[10px] mt-1 opacity-70">Failed to send</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] italic px-1">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            {typingText}
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
