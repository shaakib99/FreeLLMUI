import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allChatsMessages, setAllChatsMessages] = useState({}); // ✅ per-chat message store
  const [checkpointerId, setCheckpointerId] = useState(() => uuidv4());
  const [backendStatus, setBackendStatus] = useState("offline");
  const [isLoading, setIsLoading] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptData, setInterruptData] = useState(null);
  const abortControllerRef = useRef(null);

  // ---- init ---------------------------------------------------------------
  useEffect(() => {
    if (chatHistory.length === 0) {
      const id = uuidv4();
      setChatHistory([{ id, title: "New chat" }]);
      setActiveChatId(id);
    }
  }, [chatHistory]);

  // ---- health check -------------------------------------------------------
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://localhost:8000/check");
        setBackendStatus(res.ok ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 100000);
    return () => clearInterval(interval);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
  }, []);

  // ---- stream handler -----------------------------------------------------
  const processStream = useCallback(async (res, assistantId) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const message = JSON.parse(JSON.parse(trimmed));
          const messageType = String(message.type || "").trim().toLowerCase();

          switch (messageType) {
            case "token":
              accumulated += message.content || "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: [{ type: "text", text: accumulated }], streaming: true }
                    : m
                )
              );
              break;

            case "interrupt":
              setMessages((prev) => prev.filter((m) => m.id !== assistantId));
              setIsInterrupted(true);
              setInterruptData(message);
              break;

            default:
              console.warn("Unknown stream message type:", messageType, message);
          }
        } catch (err) {
          console.error("Failed to parse stream line:", trimmed, err);
        }
      }
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, streaming: false } : m
      )
    );
  }, []);

  // ---- send message -------------------------------------------------------
  const sendMessage = useCallback(async (text, files = [], decision = false, skills = []) => {
    setIsInterrupted(false);
    setInterruptData(null);

    const hasContent = text.trim() || files.length > 0;

    if (hasContent) {
      // Auto-title from first message
      setMessages((prev) => {
        const isFirstMessage = prev.length === 0;
        if (isFirstMessage) {
          const title = text.trim()
            ? text.trim().slice(0, 40) + (text.length > 40 ? "…" : "")
            : files.map((f) => f.name).join(", ").slice(0, 40);
          setChatHistory((prevHistory) =>
            prevHistory.map((c) =>
              c.id === activeChatId ? { ...c, title } : c
            )
          );
        }
        return prev;
      });

      const displayContent = [
        ...files.map((f) => ({
          type: "file",
          name: f.name,
          fileType: f.type,
          url: URL.createObjectURL(f),
        })),
        ...(text.trim() ? [{ type: "text", text }] : []),
      ];

      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: "user", content: displayContent, skills },
      ]);
    }

    const assistantId = uuidv4();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: [{ type: "text", text: "" }], streaming: true },
    ]);

    setIsLoading(true);

    try {
      const resolvedSkills = await Promise.all(
        skills.map(async (skill) => ({
          name: skill.name,
          description: await skill.loadContent(),
        }))
      );
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        query: text,
        checkpointer_id: checkpointerId,
        decision,
        skills: resolvedSkills,
      }));
      files.forEach((file) => formData.append("files", file));

      abortControllerRef.current = new AbortController();

      const res = await fetch(
        `http://localhost:8000/chat/${decision ? "resume" : ""}`,
        {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        }
      );

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      await processStream(res, assistantId);

    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: [{ type: "text", text: `⚠️ Error: ${err.message}` }], streaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [checkpointerId, processStream, activeChatId]);

  // ---- resume after interrupt ---------------------------------------------
  const resumeChat = useCallback((decision) => {
    sendMessage("", [], decision);
  }, [sendMessage]);

  // ---- chat management ----------------------------------------------------
  const selectChat = useCallback((id) => {
    if (id === activeChatId) return; // ✅ no-op if already active

    // Save current chat messages
    setAllChatsMessages((prev) => ({
      ...prev,
      [activeChatId]: messages,
    }));

    setActiveChatId(id);
    setCheckpointerId(uuidv4());
    setIsInterrupted(false);
    setInterruptData(null);
    setMessages(allChatsMessages[id] || []);
  }, [activeChatId, messages, allChatsMessages]);

  const newChat = useCallback(() => {
    const id = uuidv4();

    // Save current chat messages
    setAllChatsMessages((prev) => ({
      ...prev,
      [activeChatId]: messages,
    }));

    // ✅ Prepend new chat to history
    setChatHistory((prev) => [{ id, title: "New chat" }, ...prev]);
    setActiveChatId(id);
    setCheckpointerId(uuidv4());
    setIsInterrupted(false);
    setInterruptData(null);
    setMessages([]);
  }, [activeChatId, messages]);

  const value = {
    chatHistory,
    activeChatId,
    messages,
    backendStatus,
    isLoading,
    isInterrupted,
    interruptData,
    sendMessage,
    resumeChat,
    selectChat,
    newChat,
    stopStreaming,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}