import React, { useRef, useEffect } from "react";
import { ChatContext } from "../../hooks/useChat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import InterruptCard from "./InterruptCard";

export default function ChatWindow() {
  const { messages, isLoading, isInterrupted, interruptData, resumeChat } =
    React.useContext(ChatContext);
  const isDark = document.documentElement.classList.contains("dark");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isInterrupted]);

  return (
    <section className={`
      flex flex-col flex-1 overflow-hidden transition-colors duration-200
      ${isDark ? "bg-dark-bg" : "bg-gray-50"} pb-32
    `}>
      <div className={`
        flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-200
        ${isDark ? "bg-dark-bg" : "bg-gray-50"}
      `}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* ✅ Interrupt card with dynamic decisions */}
        {isInterrupted && interruptData && (
          <InterruptCard
            interruptData={interruptData}
            onDecision={(decision) => resumeChat(decision)}
          />
        )}

        {isLoading && !messages.some((m) => m.streaming) && (
          <div className="text-center text-gray-500 dark:text-dark-textSecondary">
            <span className="animate-pulse">Thinking …</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput />
    </section>
  );
}