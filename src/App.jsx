import React, { useState, useEffect } from "react";
import Layout from "./components/Layout/MainContent";
import { ChatProvider } from "./hooks/useChat";
import "./index.css"; // Tailwind base styles

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ChatProvider>
      {/* Full-screen container with light/dark background */}
      <div className={`min-h-screen ${darkMode ? 'bg-dark-bg' : 'bg-gray-50'} transition-colors duration-200`}>
        
        
        <Layout />
      </div>
    </ChatProvider>
  );
}

export default App;