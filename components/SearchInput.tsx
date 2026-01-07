
import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowUp, Globe, BookOpen, PenTool, Layout, Mic, 
  MicOff, Square, Sparkles, X, ChevronRight, Paperclip, FileText,
  Image as ImageIcon, Youtube, MonitorPlay
} from 'lucide-react';
import { SearchMode } from '../types';
import { PROMPT_TEMPLATES } from '../constants';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    onSubmit();
    setAttachedFiles([]);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles([...attachedFiles, ...Array.from(e.target.files)]);
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
    { id: 'copilot', icon: <Layout size={14} />, label: 'Assistant' },
    { id: 'youtube', icon: <Youtube size={14} />, label: 'Video' },
    { id: 'presentation', icon: <MonitorPlay size={14} />, label: 'Slides' },
  ];

  return (
    <div className="w-full relative">
      {showTemplates && (
        <div className="absolute bottom-full left-0 mb-4 w-full md:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-bottom-5">
           <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
             <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Expert Prompt Templates</span>
             </div>
             <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
               <X size={16} />
             </button>
           </div>
           <div className="max-h-[350px] overflow-y-auto p-3 space-y-4">
             {PROMPT_TEMPLATES.map((cat, i) => (
               <div key={i}>
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">{cat.category}</h4>
                 <div className="grid grid-cols-1 gap-1">
                   {cat.prompts.map((p, j) => (
                     <button
                       key={j}
                       onClick={() => {
                         setInput(p.text);
                         setShowTemplates(false);
                         textareaRef.current?.focus();
                       }}
                       className="w-full text-left p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/10 flex items-center justify-between group transition-colors"
                     >
                       <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.title}</span>
                       <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
                     </button>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2">
          {attachedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold shadow-sm">
              {file.type.startsWith('image/') ? <ImageIcon size={12} className="text-blue-500" /> : <FileText size={12} className="text-brand-500" />}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button 
                onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-brand-500/5 border-2 transition-all duration-300 overflow-hidden ${
        isListening ? 'border-red-500 ring-4 ring-red-500/10 scale-[1.01]' : 'border-gray-100 dark:border-gray-700 focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/10'
      }`}>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening closely..." : "Deep research query or ask anything..."}
          rows={1}
          className="w-full p-5 pr-40 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none max-h-[150px] overflow-y-auto font-medium"
        />
        
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
           <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileAttach} />
           <button
             onClick={() => fileInputRef.current?.click()}
             className="hidden sm:block p-2.5 rounded-2xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
             title="Attach File"
           >
             <Paperclip size={20} />
           </button>

           <button
             onClick={() => setShowTemplates(!showTemplates)}
             className={`hidden sm:block p-2.5 rounded-2xl transition-all ${
               showTemplates ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
             }`}
             title="Prompt Library"
           >
             <Sparkles size={20} />
           </button>

           {!isLoading && (
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-2xl transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
           )}

          {isLoading ? (
            <button 
              onClick={onStop}
              className="p-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-all shadow-lg active:scale-90"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={() => handleSubmit()}
              disabled={!input.trim() && attachedFiles.length === 0}
              className={`p-2.5 rounded-2xl transition-all ${
                input.trim() || attachedFiles.length > 0
                  ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/20 hover:bg-brand-700 active:scale-90' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>

        <div className="px-5 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-gray-100/50 dark:border-gray-700/50 pt-3">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2 select-none">Focus</span>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSearchMode(mode.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                searchMode === mode.id
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 ring-2 ring-brand-500/20'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
