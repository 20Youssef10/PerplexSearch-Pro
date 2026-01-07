import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message } from '../types';
import { Bot, User, Copy, Check, ExternalLink, Volume2, VolumeX, MessageSquarePlus } from 'lucide-react';
import { PERPLEXITY_MODELS } from '../constants';

interface MessageListProps {
  messages: Message[];
  onSuggestionClick: (text: string) => void;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
      title="Copy message"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const TTSButton: React.FC<{ text: string }> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Strip markdown for cleaner speech
      const cleanText = text.replace(/\[\d+\]/g, '').replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <button 
      onClick={toggleSpeech}
      className={`transition-colors p-1 ${isPlaying ? 'text-brand-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
      title={isPlaying ? "Stop listening" : "Listen to response"}
    >
      {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, onSuggestionClick }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[messages.length - 1]?.content, messages.length]);

  return (
    <div className="space-y-6 px-4">
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 mt-1">
              <Bot size={18} />
            </div>
          )}

          <div className={`relative max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${
            msg.role === 'user' 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
              : 'bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200'
          }`}>
            {msg.role === 'assistant' && (
               <div className="absolute top-2 right-2 z-10 flex gap-1">
                 <TTSButton text={msg.content} />
                 <CopyButton text={msg.content} />
               </div>
            )}
            
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words overflow-hidden">
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline" />,
                    code: ({ node, inline, className, children, ...props }: any) => {
                      return !inline ? (
                        <div className="relative group">
                          <div className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto my-2 text-xs md:text-sm">
                            <code {...props} className={className}>{children}</code>
                          </div>
                        </div>
                      ) : (
                         <code {...props} className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>

            {/* Citations Section */}
            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                  {msg.citations.map((cite, i) => (
                    <a 
                      key={i} 
                      href={cite} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 max-w-[200px] text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 transition-colors text-gray-600 dark:text-gray-400 truncate"
                    >
                      <span className="flex-shrink-0 font-mono text-[9px] w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="truncate">{new URL(cite).hostname.replace('www.', '')}</span>
                      <ExternalLink size={10} className="opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Section */}
            {msg.role === 'assistant' && (
              <div className="mt-2 pt-2 flex items-center gap-2 text-[9px] text-gray-400 dark:text-gray-500 font-medium select-none border-t border-transparent">
                {msg.model && (
                  <span title={msg.model}>
                    {PERPLEXITY_MODELS.find(m => m.id === msg.model)?.name || msg.model}
                  </span>
                )}
                {msg.responseTime && (
                  <><span>•</span><span>{(msg.responseTime / 1000).toFixed(2)}s</span></>
                )}
                {msg.usage && (
                  <><span>•</span><span>{msg.usage.total_tokens} tokens</span></>
                )}
              </div>
            )}
          </div>

          {msg.role === 'user' && (
             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400 mt-1">
               <User size={18} />
             </div>
          )}
        </div>
      ))}

      {/* Suggested Questions */}
      {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions && (
        <div className="flex flex-col items-start gap-2 pt-2 pl-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
             <MessageSquarePlus size={12} />
             Next Steps
           </div>
           <div className="flex flex-wrap gap-2">
             {messages[messages.length - 1].suggestions?.map((suggestion, i) => (
               <button
                 key={i}
                 onClick={() => onSuggestionClick(suggestion)}
                 className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm active:scale-95"
               >
                 {suggestion}
               </button>
             ))}
           </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};