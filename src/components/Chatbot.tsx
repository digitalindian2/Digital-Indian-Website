import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

// Message interface
interface Message {
  text?: string;
  sender?: 'user' | 'bot';
  type?: 'faq_suggestions';
  suggestions?: string[];
  timestamp?: string;
}

// Props for ChatInput
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSubmitting: boolean;
}

// ChatInput Component
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSubmitting }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
          placeholder="Type your message..."
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !inputValue.trim()}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

// Main Chatbot Component
const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I assist you today? Here are some things I can help with:", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    {
      type: 'faq_suggestions',
      suggestions: [
        "What services do you offer?",
        "What are your business hours?",
        "How do I contact support?",
        "How can I book a meeting?"
      ]
    }
  ]);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || status === 'submitting') return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { text, sender: 'user', timestamp: now }]);
    setStatus('submitting');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (error) {
      console.error("Chatbot API error:", error);
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now. Please try again later.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setStatus('idle');
    }
  }, [status]);

  const ChatbotButton: React.FC = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-transform z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Open chatbot"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );

  const ChatWindow: React.FC = () => (
    <div className="fixed bottom-0 right-0 w-full sm:bottom-6 sm:right-6 sm:w-96 max-h-[70vh] sm:max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">DI</div>
          <h3 className="font-semibold text-lg">Digital Indian Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-blue-700 transition-colors" aria-label="Close chat">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[calc(70vh-140px)] sm:max-h-96">
        {messages.map((msg, index) => (
          msg.type === 'faq_suggestions' ? (
            <div key={index} className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-xl shadow-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none space-y-2 animate-fadeIn">
                {msg.suggestions?.map((sugg, i) => (
                  <button key={i} onClick={() => handleSendMessage(sugg)} className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors text-sm" disabled={status==='submitting'}>
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeSlide`}>
              <div className={`max-w-[70%] p-3 rounded-xl shadow-md ${msg.sender==='user' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'}`}>
                {msg.text}
                <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
              </div>
            </div>
          )
        ))}

        {/* Typing indicator */}
        {status==='submitting' && (
          <div className="flex justify-start">
            <div className="max-w-[60px] p-3 rounded-xl shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none flex items-center space-x-1">
              <span className="dot animate-bounce bg-gray-500 dark:bg-gray-300"></span>
              <span className="dot animate-bounce animation-delay-150 bg-gray-500 dark:bg-gray-300"></span>
              <span className="dot animate-bounce animation-delay-300 bg-gray-500 dark:bg-gray-300"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isSubmitting={status==='submitting'} />
    </div>
  );

  return <>{isOpen ? <ChatWindow /> : <ChatbotButton />}</>;
};

export default Chatbot;
