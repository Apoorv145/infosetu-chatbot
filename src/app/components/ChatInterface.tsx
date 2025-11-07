'use client';

import { useState } from 'react';

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Namaste! I'm InfoSetu, your AI-powered citizen service assistant. I serve as your intelligent bridge to government services, helping you with schemes, forms, eligibility criteria, and more - all in your preferred language. How may I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        text: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickHelp = (service: string) => {
    setInput(`Tell me about ${service}`);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-lg p-6 text-center border-b">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            InfoSetu - AI Citizen Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Your intelligent bridge to government services
          </p>
        </div>

        <div className="bg-white px-6 py-3 flex justify-between items-center border-b">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">
              English
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              Hindi
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow"></button>
            <button className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow"></button>
            <button className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow"></button>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="h-96 overflow-y-auto mb-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-blue-50 border border-blue-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-none p-4 max-w-xs">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Help:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "PM-KISAN Scheme",
                "Aadhaar Services", 
                "Digital Ration Card",
                "Pension Schemes",
                "Employment Programs",
                "Health Insurance"
              ].map((service, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickHelp(service)}
                  className="bg-white border border-gray-300 rounded-xl p-3 text-center hover:bg-gray-50 transition-colors text-gray-700 font-medium hover:border-blue-300"
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask InfoSetu about government schemes, forms, eligibility..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
