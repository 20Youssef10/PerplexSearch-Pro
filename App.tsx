

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { SearchInput } from './components/SearchInput';
import { AdminDashboard } from './components/AdminDashboard';
import { Canvas } from './components/Canvas';
import { Message, Conversation, Folder, SearchMode, AppSettings, Usage, Workspace, Gem, CanvasDocument, AppLanguage, Attachment } from './types';
import { streamCompletion } from './services/perplexityService';
import { streamGeminiCompletion } from './services/geminiService';
import { streamOpenAICompletion } from './services/openaiService';
import { streamAnthropicCompletion } from './services/anthropicService';
import { streamOllamaCompletion } from './services/ollamaService';
import { searchYouTube } from './services/youtubeService';
import { readFiles } from './services/documentService';
import { DEFAULT_MODEL, NEW_CONVERSATION_ID, MODE_PROMPTS, FOLLOW_UP_INSTRUCTION, AVAILABLE_MODELS, DEFAULT_WORKSPACES, DEFAULT_GEMS } from './constants';
import { subscribeToAuth, getUserData, saveUserData, rtdb } from './services/firebase';
import { User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { AlertCircle, X } from 'lucide-react';

const ADMIN_EMAIL = "youssef2010.mahmoud@gmail.com";

const App: React.FC = () => {
  // Persistence
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('folders');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    const defaultSettings: AppSettings = {
      theme: 'system',
      model: DEFAULT_MODEL,
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      systemInstruction: '',
      projectContext: '',
      memories: [],
      profile: { displayName: '', jobTitle: '', bio: '', avatarUrl: '' },
      modelPreferences: { temperature: 0.7, topP: 0.9, customInstructions: {} },
      interface: { fontSize: 'medium', compactMode: false, soundEnabled: true, codeWrapping: false, selectedVoice: '', language: 'en' }
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // UI State
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'canvas'>('chat');
  const [currentId, setCurrentId] = useState<string>(NEW_CONVERSATION_ID);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [searchMode, setSearchMode] = useState<SearchMode>('concise');
  
  // New Features State
  const [isTemporary, setIsTemporary] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument>({ id: 'default', title: '', content: '', sources: [], createdAt: Date.now(), updatedAt: Date.now() });
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  
  // Admin & System State
  const [isBanned, setIsBanned] = useState(false);
  const [broadcast, setBroadcast] = useState<{message: string, type: 'info'|'warning'} | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const currentConversation = conversations.find(c => c.id === currentId) || {
    id: NEW_CONVERSATION_ID,
    title: 'New Search',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const messages = currentConversation.messages;

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsSidebarOpen(true); else setIsSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser && rtdb) {
        onValue(ref(rtdb, `users/${currentUser.uid}/banned`), (snap) => setIsBanned(snap.val() === true));
        try {
          const cloudData = await getUserData(currentUser.uid);
          if (cloudData) {
            if (cloudData.conversations) setConversations(cloudData.conversations);
            if (cloudData.folders) setFolders(cloudData.folders);
            if (cloudData.settings) setSettings(prev => ({...prev, ...cloudData.settings}));
          }
        } catch (e) { console.error("Sync failed", e); }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (rtdb) return onValue(ref(rtdb, 'system/broadcast'), (snap) => setBroadcast(snap.exists() ? snap.val() : null));
  }, []);

  useEffect(() => {
    if (isTemporary) return;
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('app_settings', JSON.stringify(settings));
    
    if (user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveUserData(user.uid, { conversations, folders, settings });
      }, 2000); 
    }
  }, [conversations, folders, settings, user, isTemporary]);

  useEffect(() => {
    document.documentElement.className = settings.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '') : settings.theme;
  }, [settings.theme]);

  const handleNewChat = () => { setCurrentId(NEW_CONVERSATION_ID); setInput(''); setCurrentView('chat'); if(window.innerWidth < 768) setIsSidebarOpen(false); };
  const handleClearHistory = () => { setConversations([]); setFolders([]); setCurrentId(NEW_CONVERSATION_ID); };
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const generateAutoTitle = async (convoId: string, firstQuery: string) => {
     if (!settings.apiKey) return;
     try {
       const response = await fetch('https://api.perplexity.ai/chat/completions', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ model: 'sonar', messages: [{ role: 'system', content: '3 word title.' }, { role: 'user', content: firstQuery }] })
       });
       const data = await response.json();
       const title = data.choices?.[0]?.message?.content?.replace(/["']/g, '').trim() || firstQuery;
       setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title } : c));
     } catch (e) {}
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string, fileAttachments?: File[]) => {
    e?.preventDefault();
    const query = (overrideInput || input).trim();
    if ((!query && (!fileAttachments || fileAttachments.length === 0)) || isLoading) return;

    // Process attachments
    let attachments: Attachment[] = [];
    if (fileAttachments && fileAttachments.length > 0) {
        attachments = await readFiles(fileAttachments);
    }

    // 1. YouTube Mode
    if (searchMode === 'youtube') {
       const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() };
       const tempId = currentId === NEW_CONVERSATION_ID ? Date.now().toString() : currentId;
       
       let updatedConversations = [...conversations];
       let activeConvo = updatedConversations.find(c => c.id === tempId);
       
       if (!activeConvo) {
         activeConvo = { id: tempId, title: query, messages: [userMsg], createdAt: Date.now(), updatedAt: Date.now(), isTemporary, workspaceId: currentWorkspaceId };
         if (!isTemporary) updatedConversations.unshift(activeConvo);
       } else {
         activeConvo.messages.push(userMsg);
       }

       setConversations(updatedConversations);
       setCurrentId(tempId);
       setInput('');
       setIsLoading(true);

       try {
         const videos = await searchYouTube(query);
         setConversations(prev => {
            const copy = [...prev];
            const target = copy.find(c => c.id === tempId);
            if (target) target.messages.push({ role: 'assistant', content: `Videos for "${query}":`, timestamp: Date.now(), type: 'youtube', youtubeData: videos });
            return copy;
         });
       } catch (err: any) { alert(err.message); } 
       finally { setIsLoading(false); }
       return;
    }

    // Standard Message Setup
    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now(), attachments };
    const tempId = currentId === NEW_CONVERSATION_ID ? Date.now().toString() : currentId;
    let updatedConversations = [...conversations];
    let activeConvo = updatedConversations.find(c => c.id === tempId);

    if (!activeConvo) {
      activeConvo = { id: tempId, title: query || 'New Chat', messages: [userMsg], createdAt: Date.now(), updatedAt: Date.now(), isTemporary, workspaceId: currentWorkspaceId };
      if (!isTemporary) updatedConversations.unshift(activeConvo);
      if (!isTemporary && query) generateAutoTitle(tempId, query);
    } else {
      activeConvo.messages.push(userMsg);
      if (!isTemporary) {
         updatedConversations = updatedConversations.filter(c => c.id !== tempId);
         updatedConversations.unshift(activeConvo);
      }
    }

    setConversations(updatedConversations);
    setCurrentId(tempId);
    setInput('');
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 2. Arena Mode (Split Execution)
    if (searchMode === 'arena') {
       const modelA = 'sonar-pro';
       const modelB = 'gpt-4o'; // Or fallback to available
       // Check if keys exist
       if (!settings.apiKey || !settings.openaiApiKey) {
           alert("Arena requires both Perplexity and OpenAI keys.");
           setIsLoading(false);
           return;
       }

       const arenaMsgId = Date.now();
       setConversations(prev => {
          const copy = [...prev];
          const target = copy.find(c => c.id === tempId);
          if (target) target.messages.push({ 
             role: 'arena', 
             content: '', 
             timestamp: arenaMsgId, 
             arenaComparison: { 
                 modelA: { name: 'Perplexity Sonar', content: 'Thinking...', time: 0 }, 
                 modelB: { name: 'GPT-4o', content: 'Thinking...', time: 0 } 
             }
          });
          return copy;
       });

       try {
          // Parallel execution
          const start = Date.now();
          const p1 = streamCompletion([{role:'user', content: query, timestamp: start}], modelA, settings.apiKey, (text) => {
             setConversations(prev => {
                const copy = [...prev];
                const msg = copy.find(c => c.id === tempId)?.messages.find(m => m.timestamp === arenaMsgId);
                if (msg && msg.arenaComparison) { msg.arenaComparison.modelA.content = text; msg.arenaComparison.modelA.time = Date.now() - start; }
                return copy;
             });
          }, signal);

          const p2 = streamOpenAICompletion([{role:'user', content: query, timestamp: start}], modelB, settings.openaiApiKey!, (text) => {
             setConversations(prev => {
                const copy = [...prev];
                const msg = copy.find(c => c.id === tempId)?.messages.find(m => m.timestamp === arenaMsgId);
                if (msg && msg.arenaComparison) { msg.arenaComparison.modelB.content = text; msg.arenaComparison.modelB.time = Date.now() - start; }
                return copy;
             });
          }, signal);

          await Promise.all([p1, p2]);
       } catch (e) {}
       setIsLoading(false);
       return;
    }

    // 3. Normal Execution (Analyst, Doc, Quiz, Flashcards, etc.)
    const modelConfig = AVAILABLE_MODELS.find(m => m.id === settings.model);
    const provider = modelConfig?.provider || 'perplexity';
    let apiKey = settings.apiKey;
    if (provider === 'google') apiKey = settings.googleApiKey || '';
    if (provider === 'openai') apiKey = settings.openaiApiKey || '';
    if (provider === 'anthropic') apiKey = settings.anthropicApiKey || '';
    if (provider === 'ollama') apiKey = 'dummy'; // No key needed

    if (!apiKey && provider !== 'ollama') { alert(`Missing API Key for ${provider}`); setIsLoading(false); return; }

    const assistantMsgId = Date.now() + 1;
    setConversations(prev => {
      const copy = [...prev];
      const target = copy.find(c => c.id === tempId);
      if (target) target.messages.push({ role: 'assistant', content: '', timestamp: Date.now(), model: settings.model });
      return copy;
    });

    const combinedSystem = `
      ${MODE_PROMPTS[searchMode] || MODE_PROMPTS.concise}
      ${settings.systemInstruction}
      RESEARCH CONTEXT: ${settings.projectContext}
      ${currentView === 'canvas' ? `CANVAS MODE. Current doc:\n${canvasDoc.content}` : ''}
      ${searchMode !== 'presentation' && searchMode !== 'analyst' && searchMode !== 'quiz' && searchMode !== 'flashcards' ? FOLLOW_UP_INSTRUCTION : ''}
    `.trim();

    try {
      let fullContent = '';
      const onChunk = (chunk: string, citations?: string[], usage?: Usage, grounding?: any, audioData?: string) => {
        fullContent += chunk;
        setConversations(prev => {
          const copy = [...prev];
          const target = copy.find(c => c.id === tempId);
          if (target) {
            const lastMsg = target.messages[target.messages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = fullContent;
              if (citations) lastMsg.citations = citations;
              if (usage) lastMsg.usage = usage;
              if (audioData) lastMsg.audioData = audioData;
            }
          }
          return copy;
        });
      };

      const messagesForApi = activeConvo.messages.filter(m => m.timestamp < assistantMsgId);

      // Inject File Context for RAG
      if (attachments.length > 0) {
         const fileContext = attachments.map(a => `FILE: ${a.name}\nCONTENT:\n${a.data}`).join('\n\n');
         messagesForApi[messagesForApi.length - 1].content += `\n\n[ATTACHED FILES]\n${fileContext}`;
      }

      if (provider === 'perplexity') await streamCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      else if (provider === 'google') await streamGeminiCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      else if (provider === 'openai') await streamOpenAICompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      else if (provider === 'anthropic') await streamAnthropicCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      else if (provider === 'ollama') await streamOllamaCompletion(messagesForApi, settings.model, settings.ollamaBaseUrl, onChunk, signal, combinedSystem);

      // Post-Processing for Analyst/Slides/Quiz/Flashcards
      setConversations(prev => {
        const copy = [...prev];
        const target = copy.find(c => c.id === tempId);
        if (target) {
           const lastMsg = target.messages[target.messages.length - 1];
           
           try {
              if (searchMode === 'presentation' || fullContent.includes('"slides":')) {
                  const jsonMatch = fullContent.match(/\{[\s\S]*"slides"[\s\S]*\}/);
                  if (jsonMatch) {
                      const data = JSON.parse(jsonMatch[0]);
                      if (data.slides) {
                          lastMsg.type = 'slides';
                          lastMsg.slidesData = data.slides;
                          lastMsg.content = ""; 
                      }
                  }
              } else if (searchMode === 'analyst' || fullContent.includes('"type": "bar"')) {
                  const jsonMatch = fullContent.match(/\{[\s\S]*"type"[\s\S]*\}/);
                  if (jsonMatch) {
                      const data = JSON.parse(jsonMatch[0]);
                      if (data.type && data.data) {
                          lastMsg.chartData = data;
                      }
                  }
              } else if (searchMode === 'quiz' || fullContent.includes('"questions":')) {
                  const jsonMatch = fullContent.match(/\{[\s\S]*"questions"[\s\S]*\}/);
                  if (jsonMatch) {
                      const data = JSON.parse(jsonMatch[0]);
                      if (data.questions) {
                          lastMsg.type = 'quiz';
                          lastMsg.quizData = data;
                          lastMsg.content = ""; // Hide raw JSON
                      }
                  }
              } else if (searchMode === 'flashcards' || fullContent.includes('"cards":')) {
                  const jsonMatch = fullContent.match(/\{[\s\S]*"cards"[\s\S]*\}/);
                  if (jsonMatch) {
                      const data = JSON.parse(jsonMatch[0]);
                      if (data.cards) {
                          lastMsg.type = 'flashcards';
                          lastMsg.flashcardsData = data;
                          lastMsg.content = ""; // Hide raw JSON
                      }
                  }
              }
           } catch (e) {
             console.warn("JSON parsing failed in post-processing", e);
           }
        }
        return copy;
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setConversations(prev => {
           const copy = [...prev];
           const target = copy.find(c => c.id === tempId);
           if (target) target.messages[target.messages.length - 1].content += `\n\n**Error:** ${error.message}`;
           return copy;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  if (isBanned) return <div className="h-screen flex items-center justify-center">Account Suspended</div>;

  return (
    <div className="flex h-screen md:h-screen h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {broadcast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${broadcast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-600'} text-white`}>
           <AlertCircle size={20} /> <span className="font-bold text-sm">{broadcast.message}</span> <button onClick={() => setBroadcast(null)}><X size={14}/></button>
        </div>
      )}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <Sidebar 
          conversations={conversations.filter(c => c.workspaceId === currentWorkspaceId || !c.workspaceId)}
          folders={folders.filter(f => f.workspaceId === currentWorkspaceId || !f.workspaceId)}
          currentId={currentId}
          workspaces={DEFAULT_WORKSPACES}
          currentWorkspaceId={currentWorkspaceId}
          gems={DEFAULT_GEMS}
          onSelectWorkspace={setCurrentWorkspaceId}
          onSelectGem={(gem) => { handleNewChat(); setSettings(s => ({...s, systemInstruction: gem.systemPrompt})); }}
          onSelect={(id) => { setCurrentId(id); setCurrentView('chat'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
          onDelete={(id) => setConversations(prev => prev.filter(c => c.id !== id))}
          onNew={handleNewChat}
          onCreateFolder={(name) => setFolders(prev => [{id: Date.now().toString(), name, createdAt: Date.now(), workspaceId: currentWorkspaceId}, ...prev])}
          onMoveToFolder={(cid, fid) => setConversations(prev => prev.map(c => c.id === cid ? { ...c, folderId: fid } : c))}
          onDeleteFolder={(id) => { setFolders(prev => prev.filter(f => f.id !== id)); setConversations(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined } : c)); }}
          onOpenCanvas={() => { setCurrentView('canvas'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
          isAdmin={isAdmin}
          onGoAdmin={() => setCurrentView('admin')}
        />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative">
        {currentView === 'admin' && isAdmin ? (
          <AdminDashboard onBack={() => setCurrentView('chat')} />
        ) : (
          <div className="flex flex-row h-full">
            <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${currentView === 'canvas' ? (isCanvasExpanded ? 'hidden' : 'w-1/2') : 'w-full'} ${settings.interface.compactMode ? 'text-sm' : ''}`}>
              <Header 
                isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                settings={settings} setSettings={setSettings} onClearHistory={handleClearHistory}
                user={user} isTemporary={isTemporary} onToggleTemporary={() => setIsTemporary(!isTemporary)}
                onExport={(fmt) => { /* Reuse existing export logic */ }}
              />
              <main className="flex-1 overflow-y-auto scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <div className="max-w-2xl w-full space-y-6">
                      <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tight">PerplexSearch Pro</h1>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                         {["Analyze the latest crypto trends", "Create a marketing slide deck", "Find tutorials on React 19", "Help me debug this Python script"].map(q => (
                           <button key={q} onClick={() => { setInput(q); handleSubmit(undefined, q); }} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-all text-sm text-left font-bold text-gray-600 dark:text-gray-300 shadow-sm">{q}</button>
                         ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`max-w-4xl mx-auto w-full pb-48 pt-6 ${settings.interface.compactMode ? 'px-2' : ''}`}>
                    <MessageList messages={messages} onSuggestionClick={(t) => { setInput(t); handleSubmit(undefined, t); }} codeWrapping={settings.interface.codeWrapping} selectedVoice={settings.interface.selectedVoice} />
                  </div>
                )}
              </main>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-gray-900 dark:via-gray-900 pt-16 pb-6 px-4">
                <div className="max-w-3xl mx-auto">
                  <SearchInput 
                    input={input} setInput={setInput} onSubmit={handleSubmit} onStop={handleStopGeneration}
                    isLoading={isLoading} searchMode={searchMode} setSearchMode={setSearchMode}
                  />
                </div>
              </div>
            </div>
            {currentView === 'canvas' && (
              <Canvas 
                document={canvasDoc} 
                onUpdate={(updates) => setCanvasDoc(prev => ({ ...prev, ...updates }))}
                isExpanded={isCanvasExpanded} onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
                onClose={() => setCurrentView('chat')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
