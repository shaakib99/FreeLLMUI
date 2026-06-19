import React from "react";
import { ChatContext } from "../../hooks/useChat";
import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const { chatHistory, selectChat, activeChatId, newChat } = React.useContext(ChatContext);
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <aside className={`
      w-64 border-r flex flex-col transition-colors duration-200
      ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}
      overflow-y-auto
    `}>
      <header className="p-4 flex items-center justify-between">
        <span className="text-xl font-semibold text-primary">Chat History</span>
        {/* ✅ New chat button */}
        <button
          onClick={newChat}
          className={`
            p-1.5 rounded-lg transition-colors duration-200
            ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
          `}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </header>

      {/* ✅ Fixed: single className using ternary */}
      <ul className={`divide-y transition-colors duration-200 ${isDark ? 'divide-dark-border' : 'divide-gray-100'}`}>
        {chatHistory.map((chat) => (
          <li
            key={chat.id}
            onClick={() => selectChat(chat.id)}
            className={`
              flex items-center p-3 cursor-pointer transition-colors duration-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${chat.id === activeChatId ? "bg-primary/10 dark:bg-primary/20" : ""}
            `}
          >
            <DocumentDuplicateIcon className="h-5 w-5 mr-2 shrink-0 text-primary" />
            {/* ✅ Show updated title, fall back to "New chat" */}
            <span className="truncate text-sm">
              {chat.title === "New chat" || !chat.title ? "New chat" : chat.title}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}