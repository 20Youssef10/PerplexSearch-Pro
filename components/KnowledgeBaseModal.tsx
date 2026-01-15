
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Save, CheckCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ 
  isOpen, onClose, settings, setSettings 
}) => {
  const [context, setContext] = useState(settings.projectContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setSettings(prev => ({ ...prev, projectContext: context }));
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const newEntry = `\n\n--- FILE: ${file.name} ---\n${text}\n--- END FILE ---`;
        setContext(prev => prev + newEntry);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600">
                <FileText size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Project Knowledge Base</h2>
                <p className="text-xs text-gray-500">Persistent context for all chats in this workspace.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Global Instructions & Context</label>
              <textarea 
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm resize-none"
                placeholder="Paste code snippets, project requirements, or rules here..."
              />
           </div>

           <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept=".txt,.md,.json,.csv,.js,.ts,.py" />
              <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm text-brand-600">
                 <Upload size={20} />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Click to upload text files</p>
              <p className="text-xs text-gray-400">Content will be appended to the context above.</p>
           </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end gap-3">
           <button onClick={() => setContext('')} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">Clear All</button>
           <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2">
              <Save size={16} /> Save Context
           </button>
        </div>
      </div>
    </div>
  );
};
