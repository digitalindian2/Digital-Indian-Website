import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';

interface Message {
  text?: string;
  sender?: 'user' | 'bot';
  type?: 'faq_suggestions';
  suggestions?: string[];
}

const LOCAL_STORAGE_KEY = 'chatbot_messages';

// Message bubble (same as before)
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.sender === 'user';
  const content = msg.text || '';
  const parts = content.split(/```([\s\S]*?)```/g);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] p-3 rounded-xl shadow-md ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        {parts.map((part, idx) =>
          idx % 2 === 1 ? (
            <pre key={idx} className="bg-gray-800 text-white p-2 rounded overflow-x-auto text-sm">
              <code>{part}</code>
            </pre>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </div>
    </div>
  );
};

// Chat input
const ChatInput: React.FC<{ onSendMessage: (msg: string) => void; isSubmitting: boolean }> = ({ onSendMessage, isSubmitting }) => {
  const [inputValue, setInputValue] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isSubmitting}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
        />
        <button type="submit" disabled={isSubmitting || !inputValue.trim()} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

// Main Chatbot component
const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // initial greeting if no saved messages
      setMessages([
        { text: "Hello! How can I assist you today?", sender: 'bot' },
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
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to backend
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || status === 'submitting') return;
    const userMessage: Message = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setStatus('submitting');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation: messages })
      });
      const data = await response.json();
      const botResponse: Message = { text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Sorry, I can't respond right now.", sender: 'bot' }]);
    } finally {
      setStatus('idle');
    }
  }, [messages, status]);

  const ChatbotButton: React.FC = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );

  const ChatWindow: React.FC = () => (
    <div className="fixed bottom-0 right-0 w-full sm:bottom-6 sm:right-6 sm:w-96 max-h-[70vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-t-lg">
        <h3 className="font-semibold text-lg">Digital Indian Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-blue-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[calc(70vh-140px)] sm:max-h-96">
        {messages.map((msg, index) =>
          msg.type === 'faq_suggestions' ? (
            <div key={index} className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-xl shadow-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none">
                <div className="space-y-2">
                  {msg.suggestions?.map((s, i) => (
                    <button key={i} onClick={() => handleSendMessage(s)} className="block w-full text-left px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <MessageBubble key={index} msg={msg} />
          )
        )}
        {status === 'submitting' && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-xl shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} isSubmitting={status === 'submitting'} />
    </div>
  );

  return <>{isOpen ? <ChatWindow /> : <ChatbotButton />}</>;
};

export default Chatbot;
