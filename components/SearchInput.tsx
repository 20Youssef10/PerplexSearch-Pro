import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Loader2, Globe, BookOpen, PenTool, Layout, Mic, MicOff, Square } from 'lucide-react';
import { SearchMode } from '../types';

interface SearchInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  isLoading: boolean;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  input, 
  setInput, 
  onSubmit, 
  onStop,
  isLoading, 
  searchMode, 
  setSearchMode 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(input + (input ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const modes: { id: SearchMode; icon: React.ReactNode; label: string }[] = [
    { id: 'concise', icon: <Globe size={14} />, label: 'Standard' },
    { id: 'academic', icon: <BookOpen size={14} />, label: 'Academic' },
    { id: 'writing', icon: <PenTool size={14} />, label: 'Writing' },
    { id: 'copilot', icon: <Layout size={14} />, label: 'Co-pilot' },
  ];

  return (
    <div className="w-full">
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/5 border transition-all duration-200 overflow-hidden ${
        isListening ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500'
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Ask anything... (Ctrl + K)"}
          rows={1}
          className="w-full p-4 pr-24 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none max-h-[150px] overflow-y-auto"
        />
        
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
           {!isLoading && (
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
           )}

          {isLoading ? (
            <button 
              onClick={onStop}
              className="p-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-all shadow-md"
              title="Stop generation"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={() => onSubmit()}
              disabled={!input.trim()}
              className={`p-2 rounded-xl transition-all ${
                input.trim()
                  ? 'bg-brand-600 text-white shadow-md hover:bg-brand-700' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>

        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-700/50 pt-2 mt-1">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-1">Focus</span>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSearchMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                searchMode === mode.id
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};