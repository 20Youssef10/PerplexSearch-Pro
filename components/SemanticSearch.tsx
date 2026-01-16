
import React, { useState } from 'react';
import { AppSettings, Conversation, VectorDocument } from '../types';
import { generateEmbeddings } from '../services/geminiService';
import { Search, Brain, Loader2, ArrowRight } from 'lucide-react';

interface SemanticSearchProps {
  settings: AppSettings;
  conversations: Conversation[];
  onSelectResult: (convoId: string) => void;
  onClose: () => void;
}

// Simple cosine similarity
const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const SemanticSearch: React.FC<SemanticSearchProps> = ({ settings, conversations, onSelectResult, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{convo: Conversation, score: number, snippet: string}[]>([]);
  const [vectorCache, setVectorCache] = useState<Record<string, number[]>>({}); // Temporary in-memory cache

  const handleSearch = async () => {
      if (!query.trim() || !settings.googleApiKey) return;
      setIsSearching(true);
      
      try {
          // 1. Generate query embedding
          const queryEmbedding = await generateEmbeddings(query, settings.googleApiKey);
          
          // 2. Generate/Get embeddings for conversations (very naive: embed title + last msg)
          // In prod, this would be stored in a Vector DB. Here we do it on-the-fly for demo or use cache.
          
          const scores = [];
          
          // Limit to recent 20 convos for performance in this client-side demo
          const candidates = conversations.slice(0, 20); 

          for (const convo of candidates) {
              const textToEmbed = `${convo.title}\n${convo.messages[convo.messages.length-1]?.content || ''}`.substring(0, 1000);
              let embedding = vectorCache[convo.id];
              
              if (!embedding) {
                  embedding = await generateEmbeddings(textToEmbed, settings.googleApiKey);
                  setVectorCache(prev => ({...prev, [convo.id]: embedding}));
              }
              
              const score = cosineSimilarity(queryEmbedding, embedding);
              scores.push({ convo, score, snippet: textToEmbed });
          }
          
          setResults(scores.sort((a,b) => b.score - a.score).slice(0, 5));

      } catch (e: any) {
          alert("Search failed: " + e.message);
      } finally {
          setIsSearching(false);
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-in fade-in flex flex-col items-center pt-20">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">X</button>
        
        <div className="w-full max-w-2xl px-6">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-xl">
                    <Brain size={32} />
                </div>
                <h1 className="text-2xl font-black">Semantic Memory Search</h1>
            </div>
            
            <div className="relative">
                <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by meaning (e.g., 'discussions about biology')..."
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-lg outline-none focus:border-brand-500"
                    autoFocus
                />
                <Search className="absolute left-4 top-5 text-gray-400" size={20} />
                <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="absolute right-3 top-3 p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                </button>
            </div>

            <div className="mt-8 space-y-4">
                {results.map((res, i) => (
                    <div key={res.convo.id} onClick={() => { onSelectResult(res.convo.id); onClose(); }} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600">{res.convo.title}</h3>
                            <span className="text-xs font-mono text-green-500">{(res.score * 100).toFixed(0)}% Match</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{res.snippet}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
