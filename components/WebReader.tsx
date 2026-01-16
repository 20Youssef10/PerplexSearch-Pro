
import React, { useState } from 'react';
import { Globe, ArrowRight, Loader2, X, FileText } from 'lucide-react';
import { AppSettings } from '../types';

interface WebReaderProps {
  onImport: (text: string, title: string) => void;
  onClose: () => void;
}

export const WebReader: React.FC<WebReaderProps> = ({ onImport, onClose }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!url) return;
    setIsLoading(true);
    // In a real app, use a proxy. Here we simulate or use a CORS-friendly demo endpoint if available.
    // For this demo, we'll mock the extraction or use a simple fetch if possible.
    try {
        // Mock extraction for demo stability since we don't have a backend proxy
        await new Promise(resolve => setTimeout(resolve, 1500));
        const content = `[Extracted Content from ${url}]\n\nThis is a simulated extraction of the webpage. In a production environment, this would call a backend service to scrape the HTML and return markdown.`;
        onImport(content, `Web Clip: ${url}`);
        onClose();
    } catch (e) {
        alert("Failed to read website (CORS restriction).");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl"><Globe size={24}/></div>
                <h2 className="font-bold text-xl">Web Reader</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Paste a URL to extract its content into your research context.</p>
            
            <input 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 outline-none focus:ring-2 focus:ring-teal-500"
            />
            
            <button 
                onClick={handleImport}
                disabled={isLoading || !url}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                Import Content
            </button>
        </div>
    </div>
  );
};
