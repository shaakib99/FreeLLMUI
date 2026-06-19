import React, { useCallback, useEffect, useState } from "react";
import { ChatContext } from "../../hooks/useChat";
import { SignalSlashIcon, SignalIcon } from "@heroicons/react/24/outline";
import { UserIcon, CpuChipIcon, DocumentIcon, ClipboardIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";


export default function TopBar() {
  const { backendStatus, activeChatId } = React.useContext(ChatContext);
  const [copied, setCopied] = useState(false);

  const statusIcon = backendStatus === "online"
    ? <SignalIcon className="h-5 w-5 text-green-500" />
    : <SignalSlashIcon className="h-5 w-5 text-red-500" />;

  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(() => {
    const textToCopy = activeChatId ?? "";
    if (!textToCopy) return; // nothing to copy

    // Use the modern Clipboard API
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => setCopied(true))
      .catch((err) => {
        console.error("Failed to copy chat ID:", err);
        // You could also set an error state here if you want
      });
  }, [activeChatId]);

  return (
    <header className={`
      flex items-center justify-between px-4 py-2 transition-colors duration-200
      ${isDark 
        ? 'bg-dark-surface border-dark-border' 
        : 'bg-white border-gray-200'
      }
      border-b
    `}>
      <div className="flex items-center space-x-2">
        {statusIcon}
        <span className="text-sm font-medium">
          Backend: {backendStatus}
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-dark-textSecondary">
        <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center space-x-1 rounded px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        aria-label={copied ? "Chat ID copied" : "Copy chat ID"}
      >
        {copied ? (
          <>
            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
            <span className="text-green-500">Copied!</span>
            <span>{activeChatId}</span>
          </>
        ) : (
          <>
            <ClipboardIcon className="w-3.5 h-3.5" />
            <span>{activeChatId}</span>
          </>
        )}
      </button>
      </div>
    </header>
  );
}