
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Slide, YouTubeVideo } from '../types';
import { Bot, User, Copy, Check, ExternalLink, Volume2, VolumeX, MessageSquarePlus, Brain, ChevronDown, ChevronRight, Clipboard, Pin, Play, MonitorPlay, Maximize2 } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface MessageListProps {
  messages: Message[];
  onSuggestionClick: (text: string) => void;
  onPinMessage?: (index: number) => void;
  codeWrapping?: boolean;
  selectedVoice?: string;
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CodeRunner: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Only support HTML/JS for safe preview
  if (language !== 'html' && language !== 'javascript') return null;

  const srcDoc = language === 'html' 
    ? code 
    : `<html><body><script>${code}</script></body></html>`;

  return (
    <div className="mt-2">
      <div className="flex justify-end mb-2">
        <button 
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg hover:bg-brand-100 transition-colors"
        >
          {showPreview ? <MonitorPlay size={14} /> : <Play size={14} />}
          {showPreview ? 'Hide Preview' : 'Run / Preview'}
        </button>
      </div>
      {showPreview && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white h-64 shadow-inner">
          <iframe 
            srcDoc={srcDoc} 
            className="w-full h-full" 
            sandbox="allow-scripts"
            title="Code Preview"
          />
        </div>
      )}
    </div>
  );
};

const SlideDeck: React.FC<{ slides: Slide[] }> = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className="my-4 bg-gray-900 text-white rounded-xl overflow-hidden aspect-video shadow-2xl relative flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8 text-center bg-gradient-to-br from-gray-800 to-black">
        <div className="max-w-2xl w-full">
           <h2 className="text-2xl md:text-3xl font-bold mb-6 text-brand-400">{slides[current].title}</h2>
           <ul className="space-y-3 text-left inline-block max-w-lg">
             {slides[current].content.map((item, i) => (
               <li key={i} className="flex items-start gap-2 text-lg text-gray-300">
                 <span className="text-brand-500 mt-1.5">•</span>
                 {item}
               </li>
             ))}
           </ul>
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-3 flex items-center justify-between">
         <span className="text-xs font-mono text-gray-500">Slide {current + 1} / {slides.length}</span>
         <div className="flex gap-2">
           <button 
             disabled={current === 0}
             onClick={() => setCurrent(c => c - 1)}
             className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-xs font-bold"
           >
             Prev
           </button>
           <button 
             disabled={current === slides.length - 1}
             onClick={() => setCurrent(c => c + 1)}
             className="px-3 py-1 bg-brand-600 rounded hover:bg-brand-500 disabled:opacity-50 text-xs font-bold"
           >
             Next
           </button>
         </div>
      </div>
      
      {slides[current].note && (
         <div className="bg-gray-900/90 p-2 text-xs text-gray-400 text-center border-t border-gray-800">
            Speaker Note: {slides[current].note}
         </div>
      )}
    </div>
  );
};

const YouTubeCard: React.FC<{ video: YouTubeVideo }> = ({ video }) => (
  <a 
    href={`https://www.youtube.com/watch?v=${video.id}`} 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-all group"
  >
    <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded">Video</div>
    </div>
    <div className="flex-1 min-w-0 py-1">
      <h4 className="font-bold text-sm line-clamp-2 text-gray-800 dark:text-gray-200 group-hover:text-brand-600">{video.title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.channelTitle}</p>
    </div>
  </a>
);

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, onSuggestionClick, onPinMessage, codeWrapping = false, selectedVoice 
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[messages.length - 1]?.content, messages.length]);

  const parseContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    if (thinkMatch) {
      const thought = thinkMatch[1].trim();
      const main = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/, '').trim();
      return { thought, main };
    }
    return { thought: null, main: content };
  };

  return (
    <div className="space-y-6 px-4 md:px-6">
      {messages.map((msg, idx) => {
        const { thought, main } = msg.role === 'assistant' ? parseContent(msg.content) : { thought: null, main: msg.content };

        return (
          <div 
            key={idx} 
            className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 mt-1 shadow-sm">
                <Bot size={18} />
              </div>
            )}

            <div className={`relative group max-w-[95%] md:max-w-[85%] rounded-2xl p-4 shadow-sm transition-all ${
              msg.role === 'user' 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                : 'bg-white dark:bg-gray-900/50 border text-gray-800 dark:text-gray-200'
            } ${msg.isPinned ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gray-100 dark:border-gray-800'}`}>
              
              {/* Audio Player */}
              {msg.audioData && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Volume2 className="text-brand-500" size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Audio Response</span>
                  </div>
                  <audio controls src={`data:audio/mp3;base64,${msg.audioData}`} className="w-full h-8" />
                </div>
              )}

              {/* YouTube Results */}
              {msg.youtubeData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {msg.youtubeData.map(v => <YouTubeCard key={v.id} video={v} />)}
                </div>
              )}

              {/* Slides */}
              {msg.slidesData && <SlideDeck slides={msg.slidesData} />}

              {thought && (
                 <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                   <details className="group/details">
                     <summary className="flex items-center gap-2 p-3 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer select-none">
                       <Brain size={14} className="text-amber-500" />
                       <span>Reasoning Process</span>
                       <div className="flex-1" />
                       <ChevronDown size={14} className="group-open/details:rotate-180 transition-transform" />
                     </summary>
                     <div className="p-3 pt-0 border-t border-gray-200 dark:border-gray-700/50">
                       <div className="prose prose-xs dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                         {thought}
                       </div>
                     </div>
                   </details>
                 </div>
              )}

              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{main}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline break-all" />,
                      img: ({ node, ...props }) => {
                        if (props.alt === 'Generated Video') {
                          return (
                            <div className="my-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black relative group">
                              <video src={props.src} controls className="w-full max-h-[400px]" />
                            </div>
                          );
                        }
                        return <img {...props} className="max-w-full rounded-lg my-2 border border-gray-200 dark:border-gray-700" />;
                      },
                      code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match?.[1] || '';
                        const codeString = String(children).replace(/\n$/, '');

                        return !inline ? (
                          <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                             <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                               <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{language || 'code'}</span>
                               <button onClick={() => navigator.clipboard.writeText(codeString)} className="text-gray-400 hover:text-gray-600"><Clipboard size={14}/></button>
                             </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 overflow-x-auto text-xs md:text-sm">
                              <code {...props} className={`${className} ${codeWrapping ? 'whitespace-pre-wrap break-all' : ''}`}>{children}</code>
                            </div>
                            <CodeRunner code={codeString} language={language} />
                          </div>
                        ) : (
                           <code {...props} className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">{children}</code>
                        )
                      }
                    }}
                  >
                    {main}
                  </ReactMarkdown>
                )}
              </div>

              {/* Citations Section */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Verified Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cite, i) => {
                       let label = cite;
                       try { label = new URL(cite).hostname.replace('www.', ''); } catch(e) {}
                       return (
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
                          <span className="truncate">{label}</span>
                          <ExternalLink size={10} className="opacity-50" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metadata / Timestamp Section */}
              <div className={`mt-2 flex items-center gap-2 text-[9px] text-gray-400 dark:text-gray-500 font-medium select-none ${
                msg.role === 'assistant' 
                  ? 'pt-2 border-t border-transparent' 
                  : 'justify-end opacity-0 group-hover:opacity-100 transition-opacity'
              }`}>
                {msg.role === 'assistant' ? (
                  <>
                    {msg.model && (
                      <span title={msg.model}>
                        {AVAILABLE_MODELS.find(m => m.id === msg.model)?.name || msg.model}
                      </span>
                    )}
                    {msg.responseTime && (
                      <><span>•</span><span>{(msg.responseTime / 1000).toFixed(2)}s</span></>
                    )}
                    {msg.usage && (
                      <><span>•</span><span>{msg.usage.total_tokens} tokens</span></>
                    )}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      • {formatTime(msg.timestamp)}
                    </span>
                  </>
                ) : (
                  <span>{formatTime(msg.timestamp)}</span>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400 mt-1 shadow-sm">
                 <User size={18} />
               </div>
            )}
          </div>
        );
      })}

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
                 className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm active:scale-95 text-left"
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
    