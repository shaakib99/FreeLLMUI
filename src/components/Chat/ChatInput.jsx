import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatContext } from "../../hooks/useChat";
import SkillPopup from "./SkillPopup";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
  MicrophoneIcon,
  XMarkIcon,
  DocumentIcon,
  StopIcon,
  CommandLineIcon,
} from "@heroicons/react/24/solid";

// ─── ChatInput ────────────────────────────────────────────────────────────────
export default function ChatInput() {
  const [text, setText] = useState("");
  const {
    sendMessage,
    stopStreaming,
    isLoading: isChatStreaming,
  } = React.useContext(ChatContext);

  const [showDropdown, setShowDropdown] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const isDark = document.documentElement.classList.contains("dark");
  const textareaRef = useRef(null);

  // Slash skill popup state
  const [skillPopupOpen, setSkillPopupOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);

  // track slash command range so we can remove it after selection
  const slashRangeRef = useRef({ start: -1, end: -1 });

  const MAX_ROWS = 6;
  const LINE_HEIGHT = 24;
  const MAX_HEIGHT = MAX_ROWS * LINE_HEIGHT;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    setIsStreaming(isChatStreaming);
  }, [isChatStreaming]);

  // ── Slash-command detection ────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);

    // Detect "/something" at the current typing position
    const slashMatch = before.match(/(?:^|[\s\n])(\/(\S*))$/);

    if (slashMatch) {
      const slashIndex = before.lastIndexOf("/");
      slashRangeRef.current = {
        start: slashIndex,
        end: cursor,
      };
      setSkillQuery(slashMatch[2] || "");
      setSkillPopupOpen(true);
    } else {
      slashRangeRef.current = { start: -1, end: -1 };
      setSkillPopupOpen(false);
    }
  };

  // ── Skill selected from popup ──────────────────────────────────────────────
  const handleSkillSelect = useCallback((skill) => {
    setSelectedSkill(skill);
    setSkillPopupOpen(false);

    const { start, end } = slashRangeRef.current;
    if (start === -1 || end === -1) return;

    // Remove the "/query" text from textarea completely
    setText((prev) => {
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      return `${before}${after}`.replace(/\s{2,}/g, " ");
    });

    slashRangeRef.current = { start: -1, end: -1 };
    setSkillQuery("");

    // restore cursor
    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, start);
    }, 0);
  }, []);

  const dismissSkillPopup = useCallback(() => {
    setSkillPopupOpen(false);
  }, []);

  const clearSelectedSkill = () => {
    setSelectedSkill(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // ── Send / Stop ────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (skillPopupOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", "Tab"].includes(e.key)) {
        e.preventDefault(); // important
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        dismissSkillPopup();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleSend = () => {
    const trimmedText = text.trim();

    if (!trimmedText && attachments.length === 0 && !selectedSkill) return;

    setIsStreaming(true);

    sendMessage(
      trimmedText,
      attachments.map((a) => a.file),
      false, // decision
      selectedSkill ? [selectedSkill] : []
    );

    setText("");
    setAttachments([]);
    setSelectedSkill(null);
    setSkillPopupOpen(false);
    setSkillQuery("");
    slashRangeRef.current = { start: -1, end: -1 };
  };

  const handleStopStreaming = () => {
    stopStreaming();
    setIsStreaming(false);
  };

  // ── File helpers ───────────────────────────────────────────────────────────
  const stageFile = (file) => {
    if (!file) return;
    setAttachments((prev) => [
      ...prev,
      {
        file,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      },
    ]);
    setShowDropdown(false);
  };

  const handleFileChange = (e) => {
    stageFile(e.target.files[0]);
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-auto px-4">
      <div
        className={`
          rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 border-2 p-2
          hover:shadow-3xl hover:scale-[1.02] border-b border-gray-400/50 bg-dark-surface/10 backdrop-blur-xl
        `}
      >
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-1 pb-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm max-w-[200px]
                  ${isDark
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                  }
                `}
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <DocumentIcon className="w-5 h-5 shrink-0 text-primary" />
                )}
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className={`
                    shrink-0 rounded-full p-0.5 transition-colors
                    ${isDark
                      ? "hover:bg-gray-600 text-gray-400 hover:text-white"
                      : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                    }
                  `}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected skill chip */}
        {selectedSkill && (
          <div className="px-2 pt-1 pb-2">
            <div
              className={`
                inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border
                ${isDark
                  ? "bg-primary/15 border-primary/30 text-gray-100"
                  : "bg-primary/10 border-primary/20 text-gray-800"
                }
              `}
            >
              <CommandLineIcon className="w-4 h-4 text-primary" />
              <span className="font-medium">{selectedSkill.name}</span>

              <button
                type="button"
                onClick={clearSelectedSkill}
                className={`
                  ml-1 rounded-full p-0.5 transition-colors
                  ${isDark
                    ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-1">
          {/* Attachment button */}
          <div className="relative self-center mb-0.5">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                hover:shadow-md hover:scale-105
                ${isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>

            {/* Attachment dropdown */}
            <div
              className={`
    absolute bottom-full mb-2 rounded-xl z-50 min-w-[160px]
    bg-gray-600/90 backdrop-blur-2xl
    border border-white/10 shadow-2xl
    transition-[opacity,transform] duration-200 origin-bottom
    ${showDropdown
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }
  `}
              style={{ left: 'calc(50% - 80px)' }}
            >
              <div className="p-2">
                <label
                  className={`
                    flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                    ${isDark
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Upload File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <label
                  className={`
                    flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                    ${isDark
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  type="button"
                  className={`
                    flex items-center px-3 py-2 rounded-lg w-full text-left transition-all duration-200
                    ${isDark
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  <MicrophoneIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Voice Message</span>
                </button>
              </div>
            </div>
          </div>

          {/* Textarea wrapper */}
          <div className="relative flex-1 ">
            {skillPopupOpen && (
              <SkillPopup
                query={skillQuery}
                isDark={isDark}
                onSelect={handleSkillSelect}
                onDismiss={dismissSkillPopup}
              />
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything… (type / to use a skill)"
              className={`
                w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-2
                transition-all duration-150 resize-none overflow-y-auto leading-6
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                border placeholder-gray-400 dark:placeholder-gray-400 focus:shadow-md
                border-b border-gray-600 bg-dark-surface/10 backdrop-blur-xl text-gray-200
              `}
              style={{ maxHeight: `${MAX_HEIGHT}px` }}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(false)}
              disabled={isStreaming}
            />
          </div>

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="self-center flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105"
            >
              <StopIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              className={`
                self-center flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                ${text.trim() || attachments.length > 0 || selectedSkill
                  ? "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-300 cursor-not-allowed"
                }
              `}
              disabled={!text.trim() && attachments.length === 0 && !selectedSkill}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}