
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}      

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize welcome message when language loads/changes or if empty
    if (messages.length === 0) {
        setMessages([{ id: '1', role: 'model', text: t.assistant.welcome }]);
    }
  }, [t.assistant.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await GeminiService.chatWithHR(userMsg.text, useThinking);
      const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: responseText,
          isThinking: useThinking
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: t.assistant.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full flex flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between">
            <div className="flex items-center text-white">
              <Bot className="w-6 h-6 mr-2" />
              <div>
                <h2 className="text-lg font-bold">{t.assistant.title}</h2>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                   {t.assistant.subtitle}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-blue-100 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.isThinking && (
                      <div className="flex items-center gap-1 text-xs text-purple-600 mb-1 font-semibold">
                          <BrainCircuit className="w-3 h-3" />
                          <span>{t.assistant.reasoning}</span>
                      </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
             {/* Thinking Toggle */}
             <div className="flex items-center gap-2 mb-2">
                 <button 
                    onClick={() => setUseThinking(!useThinking)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
                        useThinking 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                 >
                     <Sparkles className="w-3 h-3" />
                     {useThinking ? t.assistant.thinkingOn : t.assistant.thinkingOff}
                 </button>
                 <span className="text-xs text-gray-400">
                     {useThinking ? 'Using Gemini 3 Pro' : 'Using Gemini 2.5 Flash'}
                 </span>
             </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.assistant.placeholder}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
