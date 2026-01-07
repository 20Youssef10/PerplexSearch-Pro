
import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, Minimize2, Download, FileText, Bold, Italic, 
  List, Wand2, Plus, X, Headphones, Play, Pause, 
  Sparkles, Image as ImageIcon, CheckCircle, LayoutTemplate
} from 'lucide-react';
import { CanvasDocument, CanvasSource } from '../types';
import { rtdb } from '../services/firebase';
import { ref, onValue, set as firebaseSet } from 'firebase/database';
import { generateAudioOverview } from '../services/geminiService';

interface CanvasProps {
  document: CanvasDocument;
  onUpdate: (doc: Partial<CanvasDocument>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  document, onUpdate, isExpanded, onToggleExpand, onClose 
}) => {
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [showSources, setShowSources] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with Firebase
  useEffect(() => {
    if (rtdb && document.id !== 'default') {
        const docRef = ref(rtdb, `canvas/${document.id}`);
        const unsubscribe = onValue(docRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                // Merge remote updates if they are newer
                if (val.updatedAt > document.updatedAt) {
                    onUpdate(val);
                }
            }
        });
        return () => unsubscribe();
    }
  }, [document.id]);

  const handleUpdate = (updates: Partial<CanvasDocument>) => {
     const updatedDoc = { ...document, ...updates, updatedAt: Date.now() };
     onUpdate(updatedDoc);
     setLastSaved(Date.now());
     if (rtdb && document.id !== 'default') {
         firebaseSet(ref(rtdb, `canvas/${document.id}`), updatedDoc);
     }
  };

  const handleAddSource = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async () => {
              const text = reader.result as string;
              const newSource: CanvasSource = {
                  id: Date.now().toString(),
                  name: file.name,
                  content: text,
                  type: 'file',
                  isSelected: true
              };
              handleUpdate({ sources: [...(document.sources || []), newSource] });
          };
          reader.readAsText(file);
      }
  };

  const handleDeleteSource = (id: string) => {
      handleUpdate({ sources: (document.sources || []).filter(s => s.id !== id) });
  };

  const toggleSourceSelection = (id: string) => {
      handleUpdate({ 
          sources: (document.sources || []).map(s => s.id === id ? { ...s, isSelected: !s.isSelected } : s) 
      });
  };

  const handleGenerateAudio = async () => {
      const activeSources = (document.sources || []).filter(s => s.isSelected);
      if (activeSources.length === 0 && !document.content) {
          alert("Please select sources or add content to generate an audio overview.");
          return;
      }
      
      const combinedContent = activeSources.map(s => `SOURCE: ${s.name}\n${s.content}`).join('\n\n') + `\n\nCURRENT DOCUMENT:\n${document.content}`;
      
      setIsGeneratingAudio(true);
      try {
          // Get API Key from localStorage for simplicity in this component, or use a context/prop
          // Assuming user settings are stored in localStorage as per App.tsx
          const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
          const apiKey = settings.googleApiKey; // NotebookLM features typically use Gemini

          if (!apiKey) {
              alert("Google Gemini API Key is required for Audio Overview.");
              setIsGeneratingAudio(false);
              return;
          }

          const base64Audio = await generateAudioOverview(combinedContent, apiKey);
          if (base64Audio) {
              const blob = await (await fetch(`data:audio/mp3;base64,${base64Audio}`)).blob();
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
          } else {
              alert("Failed to generate audio.");
          }
      } catch (e) {
          alert("Error generating audio.");
          console.error(e);
      } finally {
          setIsGeneratingAudio(false);
      }
  };

  const toggleAudio = () => {
      if (!audioRef.current) return;
      if (isPlaying) {
          audioRef.current.pause();
      } else {
          audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 ${isExpanded ? 'w-full absolute inset-0 z-40' : 'w-full md:w-[600px] lg:w-[800px]'}`}>
      
      {/* LEFT SIDEBAR: SOURCES (NotebookLM Style) */}
      <div className={`w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all ${showSources ? 'translate-x-0' : '-translate-x-full absolute z-10 h-full shadow-xl'}`}>
         <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Sources</h3>
             <button onClick={() => setShowSources(false)} className="md:hidden"><X size={16} /></button>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2">
             {(document.sources || []).map(source => (
                 <div key={source.id} className="group flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                     <input 
                        type="checkbox" 
                        checked={source.isSelected} 
                        onChange={() => toggleSourceSelection(source.id)}
                        className="rounded text-brand-600 focus:ring-brand-500"
                     />
                     <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold truncate text-gray-700 dark:text-gray-300">{source.name}</div>
                         <div className="text-[10px] text-gray-400 uppercase">{source.type}</div>
                     </div>
                     <button onClick={() => handleDeleteSource(source.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><X size={14}/></button>
                 </div>
             ))}
             
             <input type="file" ref={fileInputRef} hidden onChange={handleAddSource} />
             <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 text-xs font-bold hover:border-brand-500 hover:text-brand-500 transition-all flex items-center justify-center gap-2">
                 <Plus size={14} /> Add Source
             </button>
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900">
             <div className="flex items-center gap-3">
                 <button onClick={() => setShowSources(!showSources)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${showSources ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400'}`}>
                     <LayoutTemplate size={18} />
                 </button>
                 <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                 <input 
                     value={document.title} 
                     onChange={(e) => handleUpdate({ title: e.target.value })}
                     className="bg-transparent font-bold text-lg outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 w-48 md:w-auto"
                     placeholder="Untitled Notebook"
                 />
             </div>
             
             <div className="flex items-center gap-2">
                 {/* Audio Overview Player */}
                 {audioUrl ? (
                     <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-800">
                         <button onClick={toggleAudio} className="text-brand-600 hover:text-brand-700">
                             {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                         </button>
                         <div className="h-1 w-12 bg-brand-200 rounded-full overflow-hidden">
                             <div className={`h-full bg-brand-500 ${isPlaying ? 'animate-pulse' : ''} w-2/3`}></div>
                         </div>
                         <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                     </div>
                 ) : (
                     <button 
                        onClick={handleGenerateAudio} 
                        disabled={isGeneratingAudio}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full transition-all"
                     >
                        {isGeneratingAudio ? <Sparkles size={14} className="animate-spin" /> : <Headphones size={14} />}
                        <span className="hidden sm:inline">Deep Dive</span>
                     </button>
                 )}

                 <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                 <button onClick={onToggleExpand} className="p-2 text-gray-400 hover:text-gray-600">{isExpanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
                 <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X size={18}/></button>
             </div>
          </div>

          {/* TOOLBAR */}
          <div className="h-10 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1 px-4 bg-gray-50/50 dark:bg-gray-900/50 overflow-x-auto no-scrollbar">
               <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><Bold size={14}/></button>
               <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><Italic size={14}/></button>
               <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><List size={14}/></button>
               <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2" />
               <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 hover:text-brand-600">
                   <Wand2 size={12} /> <span className="whitespace-nowrap">Magic Edit</span>
               </button>
               <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 hover:text-brand-600">
                   <ImageIcon size={12} /> <span className="whitespace-nowrap">Add Visual</span>
               </button>
               <div className="flex-1" />
               <span className="text-[10px] text-gray-400 whitespace-nowrap">Auto-saved {new Date(lastSaved).toLocaleTimeString()}</span>
          </div>

          {/* EDITOR */}
          <textarea 
              value={document.content}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              className="flex-1 w-full p-8 md:p-12 resize-none outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-serif text-lg leading-relaxed max-w-4xl mx-auto"
              placeholder="Start writing or add sources to generate content..."
          />
      </div>
    </div>
  );
};
