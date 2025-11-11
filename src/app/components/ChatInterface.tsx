'use client';

import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

type Language = 'en' | 'hi';
type Locale = 'en-IN' | 'hi-IN';

// --- (Speech objects will be initialized in state) ---

// --- Language translations for static text ---
const translations = {
  en: {
    welcome: "Namaste! I'm InfoSetu, your AI-powered citizen service assistant. I serve as your intelligent bridge to government services, helping you with schemes, forms, eligibility criteria, and more - all in your preferred language. You can also upload a document to ask questions about it. How may I assist you today?",
    title: "InfoSetu - AI Citizen Assistant",
    subtitle: "Your intelligent bridge to government services",
    quickHelp: "Quick Help:",
    placeholder: "Ask InfoSetu about government schemes, forms, eligibility...",
    listening: "Listening...",
    processing: "Processing document...",
    error: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
    voiceOn: "🔊 Voice On",
    voiceOff: "🔇 Voice Off",
  },
  hi: {
    welcome: "नमस्ते! मैं इन्फोसेतु, आपका एआई-संचालित नागरिक सेवा सहायक हूं। मैं सरकारी सेवाओं के लिए आपके बुद्धिमान सेतु के रूप में कार्य करता हूं, जो आपको योजनाओं, प्रपत्रों, पात्रता मानदंडों और बहुत कुछ के साथ आपकी पसंदीदा भाषा में मदद करता है। आप इसके बारे में प्रश्न पूछने के लिए कोई दस्तावेज़ भी अपलोड कर सकते हैं। मैं आज आपकी किस प्रकार सहायता कर सकता हूँ?",
    title: "इन्फोसेतु - एआई नागरिक सहायक",
    subtitle: "सरकारी सेवाओं के लिए आपका बुद्धिमान सेतु",
    quickHelp: "त्वरित सहायता:",
    placeholder: "इन्फोसेतु से सरकारी योजनाओं, प्रपत्रों, पात्रता के बारे में पूछें...",
    listening: "सुन रहा हूँ...",
    processing: "दस्तावेज़ संसाधित हो रहा है...",
    error: "क्षमा करें, मुझे अभी कनेक्ट करने में समस्या हो रही है। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।",
    voiceOn: "🔊 आवाज़ चालू",
    voiceOff: "🔇 आवाज़ बंद",
  }
};

export default function ChatInterface() {
  const [language, setLanguage] = useState<Language>('en');
  const [locale, setLocale] = useState<Locale>('en-IN');
  const [txt, setTxt] = useState(translations.en);

  const [messages, setMessages] = useState<Message[]>([
    {
      text: translations.en.welcome,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- NEW: Refs to hold browser-only APIs ---
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // --- NEW: Initialize browser APIs on client-side only ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = locale;
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;
      recognitionRef.current = recognitionInstance;
    }

    synthRef.current = (window as any).speechSynthesis;
  }, []); // Runs once on mount

  // Update recognition language when locale changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = locale;
    }
  }, [locale]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakMessage = (text: string) => {
    const synth = synthRef.current;
    if (!isSpeechEnabled || !synth) return;
    
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.9;
    
    const voices = synth.getVoices();
    const voice = voices.find((v: any) => v.lang === locale);
    if (voice) {
      utterance.voice = voice;
    }
    synth.speak(utterance);
  };
  
  useEffect(() => {
    if (isListening && synthRef.current) {
      synthRef.current.cancel();
    }
  }, [isListening]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    const userMessage: Message = {
      text: messageText,
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
        body: JSON.stringify({ message: messageText, language: language }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      speakMessage(data.response);

    } catch (error) {
      const errorMessage: Message = {
        text: txt.error,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakMessage(errorMessage.text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (PNG, JPG, etc.).");
        return;
      }
      setIsLoading(true);
      setIsProcessingImage(true);
      
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();
      const extractedText = ret.data.text;
      
      const ocrMessage: Message = {
        text: `(Processing document...)\n\n"${extractedText.substring(0, 150)}..."\n\nPlease ask your question about this document.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, ocrMessage]);
      
      setInput(`Based on the document I just uploaded, please tell me...`);
      setIsLoading(false);
      setIsProcessingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleListen = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Sorry, your browser does not support voice recognition.");
      return;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => {
        setInput(transcript);
        sendMessage(transcript);
      }, 100);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleQuickHelp = (service: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    const query = language === 'hi' 
      ? `मुझे ${service} के बारे में बताएं` 
      : `Tell me about ${service}`;
    sendMessage(query);
    setInput('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setTxt(translations[lang]);
    const newLocale = lang === 'en' ? 'en-IN' : 'hi-IN';
    setLocale(newLocale);
    
    setMessages(prevMessages => {
      const firstMessage = {
        ...prevMessages[0],
        text: translations[lang].welcome
      };
      return [firstMessage, ...prevMessages.slice(1)];
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-lg p-6 text-center border-b">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {txt.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {txt.subtitle}
          </p>
        </div>

        <div className="bg-white px-6 py-3 flex justify-between items-center border-b">
          <div className="flex space-x-4">
            <button 
              onClick={() => changeLanguage('en')}
              className={`px-4 py-2 rounded-lg font-medium ${
                language === 'en' ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => changeLanguage('hi')}
              className={`px-4 py-2 rounded-lg font-medium ${
                language === 'hi' ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Hindi
            </button>
          </div>
          <button 
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
            className={`px-3 py-2 rounded-lg ${isSpeechEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            {isSpeechEnabled ? txt.voiceOn : txt.voiceOff}
          </button>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="h-96 overflow-y-auto mb-6 space-y-4 p-2">
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
                  <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                  <p className={`text-xs mt-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {(isLoading || isProcessingImage) && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-none p-4 max-w-xs">
                  {isProcessingImage ? (
                    <p className="text-sm text-blue-600 animate-pulse">{txt.processing}</p>
                  ) : (
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{txt.quickHelp}</h3>
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
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
                placeholder={isListening ? txt.listening : txt.placeholder}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || isProcessingImage}
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isProcessingImage}
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                📄
              </button>
              {recognitionRef.current && (
                <button 
                  onClick={handleListen}
                  disabled={isLoading || isProcessingImage}
                  className={`px-4 py-3 rounded-xl transition-colors font-semibold ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  🎤
                </button>
              )}
              <button 
                onClick={() => sendMessage(input)}
                disabled={isLoading || isProcessingImage || !input.trim()}
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