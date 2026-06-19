import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ChatWindow from "../Chat/ChatWindow";

export default function MainContent() {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className={`
      flex h-screen transition-colors duration-200
      ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}
    `}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <ChatWindow />
      </div>
    </div>
  );
}