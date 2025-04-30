"use client";

import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX } from 'react-icons/fi';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const NotionChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I can answer questions about projects in the Notion table. What would you like to know?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/notion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 p-4 bg-[#00ff00] text-[#1a1a1a] rounded-full shadow-[0_0_10px_#00ff00] hover:bg-[#00cc00] transition z-50"
      >
        <FiMessageCircle size={24} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-20 md:right-6 md:w-[400px] md:h-[600px] bg-[#2a2a2a] border-2 border-[#00ff00] shadow-[0_0_10px_#00ff00] z-50 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-[#1a1a1a] border-b border-[#00ff00]">
            <h2 className="text-lg uppercase">Notion Chat</h2>
            <button onClick={toggleChat} className="text-[#00ff00] hover:text-[#00cc00]">
              <FiX size={24} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-[#00ff00] text-[#1a1a1a]'
                      : 'bg-[#1a1a1a] text-[#00ff00]'
                  }`}
                >
                  {msg.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}
          <div className="p-4 border-t border-[#00ff00]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 p-2 bg-[#1a1a1a] text-[#00ff00] border border-[#00ff00] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00ff00] placeholder-[#00ff00]/50 text-sm"
                placeholder="Type your message..."
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-[#00ff00] text-[#1a1a1a] rounded-sm hover:bg-[#00cc00] transition uppercase text-sm disabled:opacity-50"
                disabled={loading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={toggleChat}
        />
      )}
    </>
  );
};

export default NotionChatWidget;