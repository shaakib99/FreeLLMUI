import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatContext } from "../../hooks/useChat";
import SkillPopup from './SkillPopup'
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
  const { sendMessage, stopStreaming, isLoading: isChatStreaming } = React.useContext(ChatContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const isDark = document.documentElement.classList.contains("dark");
  const textareaRef = useRef(null);

  // Slash-command state
  const [skillPopupOpen, setSkillPopupOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  // Track the position of the slash so we can replace the right slice of text
  const slashIndexRef = useRef(-1);

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

  // ── Slash-command detection ─────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const cursor = e.target.selectionStart;

    // Find the last "/" before the cursor that starts a "word"
    const before = val.slice(0, cursor);
    const slashMatch = before.match(/(?:^|[\s\n])(\/(\S*))$/);

    if (slashMatch) {
      slashIndexRef.current = before.lastIndexOf("/");
      setSkillQuery(slashMatch[2]); // text after the slash
      setSkillPopupOpen(true);
    } else {
      setSkillPopupOpen(false);
      slashIndexRef.current = -1;
    }
  };

  // ── Skill selected from popup ───────────────────────────────────────────────
  const handleSkillSelect = useCallback(
    (skill) => {
      setSkillPopupOpen(false);

      if (slashIndexRef.current === -1) return;

      // Replace "/query" with the skill name (keep a trailing space)
      const before = text.slice(0, slashIndexRef.current);
      const cursor = textareaRef.current?.selectionStart ?? text.length;
      const after = text.slice(cursor);
      const newText = `${before}/${skill.name} ${after}`;
      setText(newText);

      // Restore focus & move cursor after inserted text
      setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        const pos = (before + "/" + skill.name + " ").length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }, 0);
    },
    [text]
  );

  const dismissSkillPopup = useCallback(() => {
    setSkillPopupOpen(false);
  }, []);

  // ── Send / Stop ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    // Let the skill popup intercept arrow keys / enter / escape first
    if (skillPopupOpen && ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
      // The popup's own keydown listener (capture phase) handles these
      return;
    }

    if (e.key === "Escape" && skillPopupOpen) {
      dismissSkillPopup();
      return;
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
    if (!text.trim() && attachments.length === 0) return;
    setIsStreaming(true);
    sendMessage(text, attachments.map((a) => a.file));
    setText("");
    setAttachments([]);
    setSkillPopupOpen(false);
  };

  const handleStopStreaming = () => {
    stopStreaming();
    setIsStreaming(false);
  };

  // ── File helpers ────────────────────────────────────────────────────────────
  const stageFile = (file) => {
    if (!file) return;
    setAttachments((prev) => [
      ...prev,
      { file, name: file.name, type: file.type, url: URL.createObjectURL(file) },
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-auto px-4">
      <div
        className={`
          rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 border-2 p-2
          hover:shadow-3xl hover:scale-[1.02]
          ${isDark ? "bg-gray-800/95 border-gray-700" : "bg-white/98 border-gray-200"}
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
                  ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}
                `}
              >
                {file.type.startsWith("image/") ? (
                  <img src={file.url} alt={file.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <DocumentIcon className="w-5 h-5 shrink-0 text-primary" />
                )}
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className={`
                    shrink-0 rounded-full p-0.5 transition-colors
                    ${isDark ? "hover:bg-gray-600 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"}
                  `}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-1">
          {/* Attachment button */}
          <div className="relative self-end mb-0.5">
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
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                rounded-lg shadow-xl border transition-all duration-200 origin-bottom z-50 min-w-[160px]
                ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
                ${showDropdown
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }
              `}
            >
              <div className="p-2">
                <label
                  className={`
                    flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                    ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}
                  `}
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Upload File</span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>

                <label
                  className={`
                    flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                    ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}
                  `}
                >
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                <button
                  type="button"
                  className={`
                    flex items-center px-3 py-2 rounded-lg w-full text-left transition-all duration-200
                    ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}
                  `}
                >
                  <MicrophoneIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Voice Message</span>
                </button>
              </div>
            </div>
          </div>

          {/* Textarea wrapper — relative so the popup anchors here */}
          <div className="relative flex-1">
            {/* Skill popup */}
            {skillPopupOpen && (
              <SkillPopup
                query={skillQuery}
                isDark={isDark}
                onSelect={handleSkillSelect}
                onDismiss={dismissSkillPopup}
                anchorRef={textareaRef}
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
                ${isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-primary"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-primary"
                }
                border placeholder-gray-400 dark:placeholder-gray-500 focus:shadow-md
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
              className="self-end flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105"
            >
              <StopIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              className={`
                self-end flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                ${text.trim() || attachments.length > 0
                  ? "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-300 cursor-not-allowed"
                }
              `}
              disabled={!text.trim() && attachments.length === 0}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}