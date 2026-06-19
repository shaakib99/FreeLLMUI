import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }]);
      setInput('');
      // Here you would typically send to an LLM API and get a response
      // For now, we'll just simulate a bot response after a short delay
      setTimeout(() => {
        setMessages([...messages, { text: "This is a simulated response from the LLM. In a real app, this would come from your LLM API.", isUser: false }]);
      }, 1000);
    }
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <h1>LLM Chat</h1>
        <div className="chat-status">
          <div>User: localhost:8000</div>
          <div>New conversation</div>
        </div>
      </header>
      
      <main className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}>
            {msg.text}
          </div>
        ))}
      </main>
      
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything. Supports markdown, code blocks, tables, and file uploads."
        />
        <button type="submit">
          Enter <span>·</span> Shift+Enter new line
        </button>
      </form>
    </div>
  );
}

export default App;