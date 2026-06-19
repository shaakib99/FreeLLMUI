import React from "react";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export default function InterruptCard({ interruptData, onDecision }) {
  const isDark = document.documentElement.classList.contains("dark");

  // Parse tool_details
  let details = {};
  try {
    details = JSON.parse(interruptData.tool_details);
  } catch (e) {
    console.error("Failed to parse tool_details:", e);
  }

  const request = details.action_requests?.[0] || {};
  const reviewConfig = details.review_configs?.[0] || {};
  const toolName = request.name || "Unknown Tool";
  const description = request.description || "";
  const args = request.args || {};
  const allowedDecisions = reviewConfig.allowed_decisions || ["approve", "reject"];

  // Color per decision keyword
  const decisionStyle = (decision) => {
    const d = decision.toLowerCase();
    if (d.includes("approve") || d.includes("accept") || d.includes("yes")) {
      return "bg-green-500 hover:bg-green-600 text-white";
    }
    if (d.includes("reject") || d.includes("deny") || d.includes("no")) {
      return "bg-red-500 hover:bg-red-600 text-white";
    }
    return isDark
      ? "bg-gray-600 hover:bg-gray-500 text-gray-100"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800";
  };

  return (
    <div className="flex items-end gap-2 flex-row">

      {/* Avatar */}
      <div className={`
        shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-1
        ${isDark ? "bg-yellow-600 text-white" : "bg-yellow-400 text-white"}
      `}>
        <WrenchScrewdriverIcon className="w-4 h-4" />
      </div>

      {/* Card */}
      <div className={`
        max-w-[75%] rounded-t-2xl rounded-br-2xl rounded-bl-md
        border-2 border-yellow-400 shadow-md overflow-hidden
        ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}
      `}>

        {/* Header */}
        <div className={`
          flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide
          ${isDark ? "bg-yellow-600/30 text-yellow-300" : "bg-yellow-50 text-yellow-700"}
        `}>
          <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
          Human Approval Required
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">

          {/* Tool name */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-0.5">Tool</p>
            <p className="font-semibold text-sm">{toolName}</p>
          </div>

          {/* Description */}
          {description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-0.5">Description</p>
              <p className="text-sm opacity-80">{description}</p>
            </div>
          )}

          {/* Args */}
          {Object.keys(args).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1">Arguments</p>
              <div className={`
                rounded-xl px-3 py-2 text-xs font-mono space-y-1
                ${isDark ? "bg-gray-700" : "bg-gray-100"}
              `}>
                {Object.entries(args).map(([key, value]) => (
                  <div key={key}>
                    <span className="opacity-60">{key}: </span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {allowedDecisions.map((decision) => (
              <button
                key={decision}
                onClick={() => onDecision(decision)}
                className={`
                  px-4 py-1.5 rounded-xl text-xs font-semibold capitalize
                  transition-all duration-150 hover:scale-105 hover:shadow-md
                  ${decisionStyle(decision)}
                `}
              >
                {decision}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}