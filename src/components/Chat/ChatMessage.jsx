import React, { useState } from "react";
import {
  UserIcon,
  CpuChipIcon,
  DocumentIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  CommandLineIcon,   // <-- ADD THIS
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isDark = document.documentElement.classList.contains("dark");
  const [copied, setCopied] = useState(false);

  const blocks = Array.isArray(message.content)
    ? message.content
    : [{ type: "text", text: message.content }];

  // Plain‑text for the copy‑button
  const plainText = blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        flex items-end gap-2 group
        ${isUser ? "flex-row-reverse" : "flex-row"}
        max-w-screen
      `}
    >
      {/* ---------- Avatar ---------- */}
      <div
        className={`
          shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-8
          ${isUser
            ? "bg-primary text-white"
            : isDark
              ? "bg-gray-600 text-gray-300"
              : "bg-gray-200 text-gray-500"}
        `}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <CpuChipIcon className="h-4 w-4" />
        )}
      </div>

      {/* ---------- Bubble + copy button wrapper ---------- */}
      <div
        className={`
          flex flex-col gap-1 max-w-[75%]
          ${isUser ? "items-end" : "items-start"}
        `}
      >
        {/* ---------- Skills chips (aesthetic) ---------- */}
        {isUser && message.skills && message.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5 px-1">
            {message.skills.map((skill) => (
              <span
                key={skill.id}
                className={`
          inline-flex items-center gap-1.5 rounded-full pl-3 pr-3 py-1 text-[11px] font-semibold tracking-wide
          backdrop-blur-md border shadow-sm
          ${isDark
                    ? "bg-primary/10 border-primary/20 text-gray-200 shadow-primary/5"
                    : "bg-white/60 border-primary/15 text-gray-700 shadow-primary/10"}
        `}
              >
                <span className={`
          w-1.5 h-1.5 rounded-full
          ${isDark ? "bg-primary/80" : "bg-primary"}
        `} />
                {skill.name}
              </span>
            ))}
          </div>
        )}

        {/* ---------- Bubble ---------- */}
        <div
          className={`
            w-full px-4 py-2.5 text-sm leading-relaxed shadow-sm flex flex-col gap-2
            ${isUser
              ? "bg-primary text-white rounded-t-2xl rounded-bl-2xl rounded-br-md"
              : isDark
                ? "bg-gray-700 text-gray-100 rounded-t-2xl rounded-br-2xl rounded-bl-md"
                : "bg-gray-100 text-gray-900 rounded-t-2xl rounded-br-2xl rounded-bl-md"}
          `}
        >
          {blocks.map((block, i) => {
            /* ---------- TEXT BLOCK ---------- */
            if (block.type === "text") {
              return (
                <div
                  key={i}
                  className={`
                    prose prose-sm max-w-none
                    ${isUser || isDark ? "prose-invert" : "prose-gray"}
                    prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0
                    prose-code:before:content-none prose-code:after:content-none
                    break-words overflow-wrap-anywhere
                    overflow-x-hidden
                  `}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      /* ----- Code blocks ----- */
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={isDark ? oneDark : oneLight}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-xl text-xs my-1"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code
                            className={`
                              px-1.5 py-0.5 rounded-md text-xs font-mono
                              ${isUser
                                ? "bg-white/20"
                                : isDark
                                  ? "bg-gray-600"
                                  : "bg-gray-200"}
                            `}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },

                      /* ----- Links ----- */
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 opacity-80 hover:opacity-100"
                          >
                            {children}
                          </a>
                        );
                      },

                      /* ----- Tables ----- */
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto rounded-xl my-1">
                            <table className="text-xs border-collapse w-full max-w-full">
                              {children}
                            </table>
                          </div>
                        );
                      },

                      th({ children }) {
                        return (
                          <th
                            className={`
                              px-3 py-1.5 text-left font-semibold border
                              ${isDark
                                ? "border-gray-600 bg-gray-600"
                                : "border-gray-300 bg-gray-200"}
                            `}
                          >
                            {children}
                          </th>
                        );
                      },

                      td({ children }) {
                        return (
                          <td
                            className={`
                              px-3 py-1.5 border
                              ${isDark ? "border-gray-600" : "border-gray-300"}
                            `}
                          >
                            {children}
                          </td>
                        );
                      },
                    }}
                  >
                    {block.text}
                  </ReactMarkdown>

                  {/* Streaming cursor */}
                  {message.streaming && i === blocks.length - 1 && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              );
            }

            /* ---------- FILE BLOCK ---------- */
            if (block.type === "file") {
              if (block.fileType?.startsWith("image/")) {
                return (
                  <img
                    key={i}
                    src={block.url}
                    alt={block.name}
                    className="max-w-full max-h-60 object-cover rounded-xl"
                  />
                );
              }

              return (
                <div
                  key={i}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                    ${isUser ? "bg-white/20" : isDark ? "bg-gray-600" : "bg-gray-200"}
                  `}
                >
                  <DocumentIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{block.name}</span>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* ---------- Copy button ---------- */}
        {!message.streaming && plainText && (
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-xs
              opacity-0 group-hover:opacity-100 transition-all duration-200
              ${isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"}
            `}
          >
            {copied ? (
              <>
                <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}