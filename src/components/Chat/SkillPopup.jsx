/* ──────────────────────────────────────────────────────────────────────────────
   SkillPopup.jsx
   --------------------------------------------------
   • Uses `useSkills` to discover markdown skills in
     /agent/skills/public (lazy loaded).
   • Shows a tiny “Loading…” message while the catalog is built.
   • Displays an error message if something goes wrong.
   • Otherwise behaves exactly like your original component.
   ──────────────────────────────────────────────────────────────────────────────*/

import React, { useState, useRef, useEffect } from "react";
import { CommandLineIcon } from "@heroicons/react/24/solid";

// ------------------------------------------------------------------
// 1️⃣ IMPORT the hook that discovers the skills
// ------------------------------------------------------------------
import { useSkills } from "../../hooks/useSkills";   // <-- adjust the path if needed

// ------------------------------------------------------------------
// 2️⃣ Component
// ------------------------------------------------------------------
function SkillPopup({ query, isDark, onSelect, onDismiss, anchorRef }) {
  // ---- hook -----------------------------------------------
  const { skills, loading, error } = useSkills();

  // ---- state -----------------------------------------------
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  // ---- filtering --------------------------------------------
  const filtered = skills.filter(
    (s) =>
      query === "" ||
      s.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.description?.toLowerCase().includes(query.toLowerCase())
  );

  // ---- inactive list handling --------------------------------
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // ---- keyboard navigation ----------------------------------
  useEffect(() => {
    const handleKey = (e) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key))
        return;
      e.preventDefault();
      e.stopPropagation(); 
      if (e.key === "Escape") {
        onDismiss();
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (filtered[activeIndex]) onSelect(filtered[activeIndex]);
        return;
      }
      setActiveIndex((prev) =>
        e.key === "ArrowDown"
          ? Math.min(prev + 1, filtered.length - 1)
          : Math.max(prev - 1, 0)
      );
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [activeIndex, filtered, onSelect, onDismiss]);

  // ---- scroll active item into view --------------------------
  useEffect(() => {
    const el = listRef.current?.children[activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ---- loading/error renders --------------------------------
  if (loading) {
    return (
      <div
        className={`
          absolute bottom-full left-0 mb-3 w-80
          flex items-center justify-center
          rounded-xl px-4 py-2
          bg-white text-gray-600
          border border-gray-200 shadow
        `}
      >
        Loading skills…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`
          absolute bottom-full left-0 mb-3 w-80
          flex items-center justify-center
          rounded-xl px-4 py-2
          bg-red-50 text-red-600
          border border-red-200 shadow
        `}
      >
        Failed to load skills
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 3️⃣ The actual popup UI (unchanged except for using `filtered` above)
  // ──────────────────────────────────────────────────────────────
  if (filtered.length === 0) return null;

  return (
    <div
      className={`
        absolute bottom-full left-0 mb-3 w-80 max-h-64 overflow-y-auto
        rounded-xl shadow-2xl border z-50
        ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider
          ${isDark ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-400"}
        `}
      >
        <CommandLineIcon className="w-3.5 h-3.5" />
        Skills {query && <span className="normal-case font-normal">— {query}</span>}
      </div>

      {/* List */}
      <ul ref={listRef} className="p-1">
        {filtered.map((skill, i) => (
          <li key={skill.id}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(skill);
              }}
              onSelect={(e) => {
                e.preventDefault();
                onSelect(skill);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`
                w-full flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors duration-100
                ${
                  i === activeIndex
                    ? isDark
                      ? "bg-primary/20 text-white"
                      : "bg-primary/10 text-gray-900"
                    : isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-mono text-xs">/</span>
                <span className="font-medium text-sm">{skill.name}</span>
              </span>
              {/* <span
                className={`text-xs mt-0.5 line-clamp-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {skill.description}
              </span> */}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SkillPopup;