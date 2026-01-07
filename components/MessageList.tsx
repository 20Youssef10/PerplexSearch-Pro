
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import PptxGenJS from 'pptxgenjs';
import { Message, Slide, YouTubeVideo, ChartData, QuizData, FlashcardDeck } from '../types';
import { Bot, User, Copy, Check, ExternalLink, Volume2, MessageSquarePlus, Brain, ChevronDown, ChevronRight, Clipboard, Play, MonitorPlay, ListMusic, X, Download, Swords, Award, RotateCcw } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface MessageListProps {
  messages: Message[];
  onSuggestionClick: (text: string) => void;
  onPinMessage?: (index: number) => void;
  codeWrapping?: boolean;
  selectedVoice?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Sub-components ---

const QuizCard: React.FC<{ quiz: QuizData }> = ({ quiz }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const question = quiz.questions[current];

  const handleSelect = (idx: number) => {
    if (showAnswer) return;
    setSelected(idx);
    setShowAnswer(true);
    if (question.options[idx] === question.answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (current < quiz.questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowAnswer(false);
    }
  };

  return (
    <div className="my-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="bg-brand-50 dark:bg-brand-900/20 p-4 border-b border-brand-100 dark:border-brand-800 flex justify-between items-center">
         <h3 className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2"><Award size={18}/> {quiz.title}</h3>
         <span className="text-xs font-bold text-gray-500">Score: {score}/{quiz.questions.length}</span>
      </div>
      <div className="p-6">
         <div className="mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Question {current + 1} of {quiz.questions.length}</div>
         <h4 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">{question.question}</h4>
         <div className="space-y-3">
           {question.options.map((opt, i) => {
             let bg = 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
             if (showAnswer) {
               if (opt === question.answer) bg = 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300';
               else if (selected === i) bg = 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300';
               else bg = 'opacity-50';
             }
             
             return (
               <button 
                 key={i} 
                 onClick={() => handleSelect(i)}
                 disabled={showAnswer}
                 className={`w-full text-left p-4 rounded-xl border border-transparent transition-all font-medium ${bg}`}
               >
                 <span className="mr-3 font-bold opacity-50">{String.fromCharCode(65 + i)}.</span>
                 {opt}
               </button>
             );
           })}
         </div>
         {showAnswer && (
           <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
             <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
               <strong>Explanation:</strong> {question.explanation || "No explanation provided."}
             </p>
           </div>
         )}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <button 
          onClick={nextQuestion} 
          disabled={!showAnswer || current === quiz.questions.length - 1}
          className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700"
        >
          {current === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

const FlashcardDeckView: React.FC<{ deck: FlashcardDeck }> = ({ deck }) => {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrent(c => (c + 1) % deck.cards.length), 200);
  };

  const prevCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrent(c => (c - 1 + deck.cards.length) % deck.cards.length), 200);
  };

  return (
    <div className="my-4">
      <h3 className="text-center font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">{deck.title} ({current + 1}/{deck.cards.length})</h3>
      <div 
        className="relative h-64 w-full perspective-1000 group cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
           {/* Front */}
           <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Front</span>
              <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">{deck.cards[current].front}</p>
              <span className="absolute bottom-4 text-xs text-gray-400">Click to flip</span>
           </div>
           {/* Back */}
           <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4">Back</span>
              <p className="text-lg md:text-xl font-medium text-brand-900 dark:text-brand-100">{deck.cards[current].back}</p>
           </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-6">
         <button onClick={prevCard} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-sm">Previous</button>
         <button onClick={() => setFlipped(!flipped)} className="px-4 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-200 font-bold text-sm flex items-center gap-2"><RotateCcw size={14}/> Flip</button>
         <button onClick={nextCard} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-sm">Next</button>
      </div>
    </div>
  );
};

const CodeRunner: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [showPreview, setShowPreview] = useState(false);
  if (language !== 'html' && language !== 'javascript') return null;
  const srcDoc = language === 'html' ? code : `<html><body><script>${code}</script></body></html>`;

  return (
    <div className="mt-2">
      <div className="flex justify-end mb-2">
        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg hover:bg-brand-100 transition-colors">
          {showPreview ? <MonitorPlay size={14} /> : <Play size={14} />} {showPreview ? 'Hide Preview' : 'Run / Preview'}
        </button>
      </div>
      {showPreview && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white h-64 shadow-inner">
          <iframe srcDoc={srcDoc} className="w-full h-full" sandbox="allow-scripts" title="Code Preview" />
        </div>
      )}
    </div>
  );
};

const SlideDeck: React.FC<{ slides: Slide[] }> = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  const exportPPTX = () => {
    const pptx = new PptxGenJS();
    slides.forEach(s => {
      const slide = pptx.addSlide();
      slide.addText(s.title, { x: 1, y: 1, w: '80%', fontSize: 24, bold: true });
      slide.addText(s.content.join('\n'), { x: 1, y: 2, w: '80%', fontSize: 16 });
      if (s.note) slide.addNotes(s.note);
    });
    pptx.writeFile({ fileName: "Presentation.pptx" });
  };

  return (
    <div className="my-4 bg-gray-900 text-white rounded-xl overflow-hidden aspect-video shadow-2xl relative flex flex-col group">
      <button onClick={exportPPTX} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Download PPTX">
         <Download size={16} />
      </button>
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
      <div className="bg-gray-800 p-3 flex items-center justify-between">
         <span className="text-xs font-mono text-gray-500">Slide {current + 1} / {slides.length}</span>
         <div className="flex gap-2">
           <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-xs font-bold">Prev</button>
           <button disabled={current === slides.length - 1} onClick={() => setCurrent(c => c + 1)} className="px-3 py-1 bg-brand-600 rounded hover:bg-brand-500 disabled:opacity-50 text-xs font-bold">Next</button>
         </div>
      </div>
    </div>
  );
};

const DataChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  return (
    <div className="my-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">{chart.title}</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
             <LineChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={COLORS[i%COLORS.length]}/>)}</LineChart>
          ) : chart.type === 'bar' ? (
             <BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k,i)=><Bar key={k} dataKey={k} fill={COLORS[i%COLORS.length]}/>)}</BarChart>
          ) : chart.type === 'area' ? (
             <AreaChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k,i)=><Area key={k} type="monotone" dataKey={k} fill={COLORS[i%COLORS.length]} stroke={COLORS[i%COLORS.length]}/>)}</AreaChart>
          ) : (
             <PieChart><Pie data={chart.data} dataKey={chart.yKeys[0]} nameKey={chart.xKey} cx="50%" cy="50%" outerRadius={80} label>{chart.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
       mermaid.run({ nodes: [ref.current] }).catch(console.error);
    }
  }, [code]);
  return <div className="mermaid my-4 text-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl overflow-x-auto" ref={ref}>{code}</div>;
};

const YouTubeCard: React.FC<{ video: YouTubeVideo }> = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlaylist = video.type === 'playlist';
  const embedUrl = isPlaylist ? `https://www.youtube.com/embed/videoseries?list=${video.id}` : `https://www.youtube.com/embed/${video.id}?autoplay=1`;

  if (isPlaying) {
    return (
      <div className="flex flex-col w-full bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl transition-all animate-in zoom-in-95 duration-200">
        <div className="relative w-full aspect-video">
          <iframe src={embedUrl} title={video.title} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
        <div className="p-3 bg-gray-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
               {isPlaylist ? <ListMusic size={16} className="text-brand-400 flex-shrink-0" /> : <Play size={16} className="text-brand-400 flex-shrink-0" />}
               <span className="text-xs font-bold text-white truncate">{video.title}</span>
            </div>
            <button onClick={() => setIsPlaying(false)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:shadow-md transition-all group cursor-pointer" onClick={() => setIsPlaying(true)}>
      <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden relative group-hover:ring-2 ring-brand-500 transition-all">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center transform scale-90 group-hover:scale-105 transition-transform">
               {isPlaylist ? <ListMusic size={14} className="text-gray-900 ml-0.5"/> : <Play size={14} className="text-gray-900 ml-0.5" fill="currentColor" />}
            </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
        <div>
           <h4 className="font-bold text-sm line-clamp-2 text-gray-800 dark:text-gray-200 group-hover:text-brand-600 transition-colors leading-tight">{video.title}</h4>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{video.channelTitle}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, onSuggestionClick, onPinMessage, codeWrapping = false 
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
  }, []);

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
        // Arena Mode Rendering
        if (msg.role === 'arena' && msg.arenaComparison) {
          const { modelA, modelB } = msg.arenaComparison;
          return (
            <div key={idx} className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-brand-600 font-bold uppercase tracking-widest text-xs">
                 <Swords size={16} /> Model Arena Fight
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[modelA, modelB].map((m, i) => (
                   <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                         <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{m.name}</span>
                         <span className="text-xs font-mono text-gray-400">{(m.time / 1000).toFixed(2)}s</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                         <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          );
        }

        const { thought, main } = msg.role === 'assistant' ? parseContent(msg.content) : { thought: null, main: msg.content };

        return (
          <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 mt-1 shadow-sm">
                <Bot size={18} />
              </div>
            )}

            <div className={`relative group max-w-[95%] md:max-w-[85%] rounded-2xl p-4 shadow-sm transition-all ${
              msg.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200'
            }`}>
              
              {/* Special Attachments */}
              {msg.audioData && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Volume2 className="text-brand-500" size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Audio Response</span>
                  </div>
                  <audio controls src={`data:audio/mp3;base64,${msg.audioData}`} className="w-full h-8" />
                </div>
              )}

              {msg.youtubeData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {msg.youtubeData.map(v => <YouTubeCard key={v.id} video={v} />)}
                </div>
              )}

              {msg.slidesData && <SlideDeck slides={msg.slidesData} />}
              
              {msg.chartData && <DataChart chart={msg.chartData} />}

              {/* NEW: Quiz Rendering */}
              {msg.quizData && <QuizCard quiz={msg.quizData} />}

              {/* NEW: Flashcards Rendering */}
              {msg.flashcardsData && <FlashcardDeckView deck={msg.flashcardsData} />}

              {thought && (
                 <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                   <details className="group/details">
                     <summary className="flex items-center gap-2 p-3 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer select-none">
                       <Brain size={14} className="text-amber-500" /><span>Reasoning Process</span>
                       <ChevronDown size={14} className="ml-auto group-open/details:rotate-180 transition-transform" />
                     </summary>
                     <div className="p-3 pt-0 border-t border-gray-200 dark:border-gray-700/50">
                       <div className="prose prose-xs dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">{thought}</div>
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
                      code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match?.[1] || '';
                        const codeString = String(children).replace(/\n$/, '');
                        
                        // Render Mermaid Diagrams
                        if (!inline && language === 'mermaid') {
                           return <MermaidDiagram code={codeString} />;
                        }

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
              
              {/* Footer Metadata */}
              <div className={`mt-2 flex items-center gap-2 text-[9px] text-gray-400 font-medium select-none ${msg.role === 'assistant' ? 'pt-2 border-t border-transparent' : 'justify-end'}`}>
                 {msg.role === 'assistant' && msg.model && <span>{msg.model}</span>}
                 <span>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500 mt-1"><User size={18} /></div>}
          </div>
        );
      })}
      
      {/* Suggestions */}
      {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions && (
        <div className="flex flex-col items-start gap-2 pt-2 pl-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"><MessageSquarePlus size={12} /> Next Steps</div>
           <div className="flex flex-wrap gap-2">
             {messages[messages.length - 1].suggestions?.map((suggestion, i) => (
               <button key={i} onClick={() => onSuggestionClick(suggestion)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-500 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 text-left">{suggestion}</button>
             ))}
           </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};
