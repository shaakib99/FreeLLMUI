import React from "react";
import { ChatContext } from "../../hooks/useChat";
import { DocumentDuplicateIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 56; // w-14
const DEFAULT_WIDTH = 256;  // w-64
const STORAGE_KEY = "sidebar-width";

export default function Sidebar() {
  const { chatHistory, selectChat, activeChatId, newChat } = React.useContext(ChatContext);
  const isDark = document.documentElement.classList.contains('dark');
  
  const [collapsed, setCollapsed] = React.useState(false);
  const [width, setWidth] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  
  const sidebarRef = React.useRef(null);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);

  // Persist width to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, width.toString());
  }, [width]);

  const toggleCollapse = () => setCollapsed((c) => !c);

  const startResizing = React.useCallback((e) => {
    if (collapsed) return;
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarRef.current?.getBoundingClientRect().width || width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [collapsed, width]);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = React.useCallback((e) => {
    if (!isResizing) return;
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + diff));
    setWidth(newWidth);
  }, [isResizing]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
      };
    }
  }, [isResizing, resize, stopResizing]);

  // When collapsed, use the narrow width; when expanded, restore the saved width
  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
      className={`
        border-r flex flex-col
        ${isResizing ? '' : 'transition-[width] duration-200 ease-out'}
        ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}
        overflow-y-auto relative select-none pt-10
      `}
    >
      <header className="p-4 flex items-center justify-between">
        <span 
          className="text-xl font-semibold text-primary truncate whitespace-nowrap" 
          style={{ 
            width: collapsed ? 0 : '100%', 
            opacity: collapsed ? 0 : 1, 
            transition: 'opacity 0.2s, width 0.2s' 
          }}
        >
          {collapsed ? '' : 'Chat History'}
        </span>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleCollapse} 
            className={`
              p-1.5 rounded-lg transition-colors duration-200
              ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
            `}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
          {!collapsed && (
            <button
              onClick={newChat}
              className={`
                p-1.5 rounded-lg transition-colors duration-200
                ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
              `}
              title="New chat"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {!collapsed && (
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
              <span className="truncate text-sm">
                {chat.title === "New chat" || !chat.title ? "New chat" : chat.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={startResizing}
          className={`
            absolute top-0 right-0 h-full w-3 cursor-col-resize z-50
            flex items-center justify-center
            ${isResizing ? 'bg-primary/20' : 'hover:bg-primary/10'}
            transition-colors
          `}
        >
          <div className={`
            h-8 w-0.5 rounded-full
            ${isResizing ? 'bg-primary' : 'bg-gray-400/50'}
          `} />
        </div>
      )}
    </aside>
  );
}