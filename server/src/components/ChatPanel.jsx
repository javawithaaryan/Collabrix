import { useEffect, useState } from "react";

import axios from "../lib/axios";

import socket from "../socket";

const ChatPanel = ({ projectId }) => {
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `/messages/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text.trim()) return;

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "/messages",
        {
          project: projectId,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("send-message", {
        projectId,
        message: res.data,
      });

      setMessages((prev) => [...prev, res.data]);

      setText("");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMessages();

    socket.on("receive-message", (data) => {
      setMessages((prev) => [
        ...prev,
        data.message,
      ]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-5">
        Team Chat
      </h2>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-5">
        {messages.map((message) => (
          <div
            key={message._id}
            className="bg-zinc-900 rounded-2xl p-4"
          >
            <p className="text-sm text-zinc-400 mb-2">
              {message.sender?.name || "User"}
            </p>

            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Send message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-white text-black px-6 rounded-xl font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;