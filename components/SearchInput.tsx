
import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowUp, Globe, BookOpen, PenTool, Layout, Mic, 
  MicOff, Square, Sparkles, X, ChevronRight, Paperclip, FileText,
  Image as ImageIcon, Youtube, MonitorPlay, BarChart3, Swords, Plus,
  GraduationCap, Layers
} from 'lucide-react';
import { SearchMode } from '../types';
import { PROMPT_TEMPLATES } from '../constants';
import { readFiles } from '../services/documentService';

interface SearchInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e?: React.FormEvent, attachments?: File[]) => void;
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
  const [showTools, setShowTools] = useState(false);
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
    
    // Auto-switch to Analyst mode if CSV/JSON is uploaded
    if (attachedFiles.some(f => f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
        setSearchMode('analyst');
    }

    onSubmit(undefined, attachedFiles);
    setAttachedFiles([]);
    setShowTools(false);
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
    if (!SpeechRecognition) { alert("Voice input is not supported."); return; }
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

  const modes: { id: SearchMode; icon: React.ReactNode; label: string; description: string }[] = [
    { id: 'concise', icon: <Globe size={18} />, label: 'Standard', description: 'Fast, concise answers' },
    { id: 'academic', icon: <BookOpen size={18} />, label: 'Academic', description: 'Citations & deep research' },
    { id: 'copilot', icon: <Layout size={18} />, label: 'Assistant', description: 'Step-by-step problem solving' },
    { id: 'youtube', icon: <Youtube size={18} />, label: 'Video', description: 'Search YouTube videos' },
    { id: 'analyst', icon: <BarChart3 size={18} />, label: 'Analyst', description: 'Data visualization & analysis' },
    { id: 'arena', icon: <Swords size={18} />, label: 'Arena', description: 'Compare AI models side-by-side' },
    { id: 'presentation', icon: <MonitorPlay size={18} />, label: 'Slides', description: 'Generate presentations' },
    { id: 'quiz', icon: <GraduationCap size={18} />, label: 'Quiz Maker', description: 'Generate interactive quizzes' },
    { id: 'flashcards', icon: <Layers size={18} />, label: 'Flashcards', description: 'Create study flashcards' },
  ];

  const activeMode = modes.find(m => m.id === searchMode) || modes[0];

  return (
    <div className="w-full relative">
      {/* Templates Popover */}
      {showTemplates && (
        <div className="absolute bottom-full left-0 mb-4 w-full md:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-bottom-5">
           <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
             <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Prompt Templates</span>
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
                       onClick={() => { setInput(p.text); setShowTemplates(false); textareaRef.current?.focus(); }}
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

      {/* Tools / Modes Popover */}
      {showTools && (
        <div className="absolute bottom-full right-0 mb-4 w-full md:w-[480px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-bottom-5">
           <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
             <div className="flex items-center gap-2">
                <Plus size={16} className="text-brand-500" />
                <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Research Tools & Modes</span>
             </div>
             <button onClick={() => setShowTools(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
               <X size={16} />
             </button>
           </div>
           <div className="p-3 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
             {modes.map((mode) => (
               <button
                 key={mode.id}
                 onClick={() => { setSearchMode(mode.id); setShowTools(false); }}
                 className={`flex items-start gap-3 p-3 rounded-xl transition-all border text-left ${
                   searchMode === mode.id
                     ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 ring-1 ring-brand-500'
                     : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                 }`}
               >
                 <div className={`mt-0.5 p-2 rounded-lg ${searchMode === mode.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                   {mode.icon}
                 </div>
                 <div>
                   <h4 className={`text-sm font-bold ${searchMode === mode.id ? 'text-brand-700 dark:text-brand-400' : 'text-gray-900 dark:text-gray-100'}`}>{mode.label}</h4>
                   <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-1">{mode.description}</p>
                 </div>
               </button>
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
          placeholder={isListening ? "Listening..." : "Deep research, data analysis, or documents..."}
          rows={1}
          className="w-full p-5 pr-20 md:pr-40 pb-16 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none max-h-[150px] overflow-y-auto font-medium"
        />
        
        {/* Active Mode Indicator (Bottom Left inside Input) */}
        <div className="absolute bottom-4 left-5 flex items-center gap-2 z-10">
           <button onClick={() => setShowTools(!showTools)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors group">
              <span className="text-brand-600 dark:text-brand-400">{activeMode.icon}</span>
              <span className="hidden md:inline text-xs font-bold text-gray-600 dark:text-gray-300">{activeMode.label}</span>
           </button>
           {searchMode !== 'concise' && (
             <button onClick={() => setSearchMode('concise')} className="p-1 text-gray-400 hover:text-red-500" title="Reset to Standard">
               <X size={12} />
             </button>
           )}
        </div>

        {/* Controls (Bottom Right inside Input) */}
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
           
           <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

           <button
             onClick={() => setShowTools(!showTools)}
             className={`p-2.5 rounded-2xl transition-all ${
               showTools ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
             }`}
             title="Add Tool / Change Mode"
           >
             <Plus size={20} />
           </button>

           {!isLoading && (
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-2xl transition-all hidden md:block ${
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
      </div>
    </div>
  );
};
