
import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Download, FileText, Bold, Italic, List, Type, Wand2 } from 'lucide-react';
import { CanvasDocument } from '../types';
import { rtdb } from '../services/firebase';
import { ref, onValue, set as firebaseSet } from 'firebase/database';

interface CanvasProps {
  document: CanvasDocument;
  onUpdate: (content: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  document, onUpdate, isExpanded, onToggleExpand, onClose 
}) => {
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  
  // Real-time Sync
  useEffect(() => {
    if (rtdb && document.id !== 'default') {
        const docRef = ref(rtdb, `canvas/${document.id}`);
        // Listen for external changes
        const unsubscribe = onValue(docRef, (snapshot) => {
            const val = snapshot.val();
            if (val && val.content !== document.content) {
                onUpdate(val.content);
            }
        });
        return () => unsubscribe();
    }
  }, [document.id]);

  const handleContentChange = (newContent: string) => {
     onUpdate(newContent);
     setLastSaved(Date.now());
     
     // Sync to Firebase (debouncing should be added in production)
     if (rtdb && document.id !== 'default') {
         firebaseSet(ref(rtdb, `canvas/${document.id}`), {
             content: newContent,
             updatedAt: Date.now()
         });
     }
  };

  const handleDownload = () => {
    const blob = new Blob([document.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title || 'canvas-doc'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 ${isExpanded ? 'w-full absolute inset-0 z-40' : 'w-[500px]'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
           <FileText className="text-brand-600" size={20} />
           <input 
             value={document.title}
             onChange={() => {}}
             className="bg-transparent font-bold text-sm outline-none text-gray-700 dark:text-gray-200"
             placeholder="Untitled Document"
           />
           <span className="text-[10px] text-gray-400">Saved {new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={handleDownload} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500" title="Export"><Download size={16} /></button>
           <button onClick={onToggleExpand} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500">{isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
           <button onClick={onClose} className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg ml-2">Done</button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500"><Bold size={14} /></button>
        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500"><Italic size={14} /></button>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500"><List size={14} /></button>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-xs font-bold rounded hover:bg-brand-100">
           <Wand2 size={12} /> AI Write
        </button>
      </div>

      <textarea
        className="flex-1 w-full p-8 resize-none outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm leading-relaxed"
        value={document.content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing..."
      />
    </div>
  );
};
