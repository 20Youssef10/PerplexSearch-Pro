import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { SearchInput } from './components/SearchInput';
import { AdminDashboard } from './components/AdminDashboard';
import { Canvas } from './components/Canvas';
import { Message, Conversation, Folder, SearchMode, AppSettings, Usage, Workspace, Gem, CanvasDocument } from './types';
import { streamCompletion } from './services/perplexityService';
import { streamGeminiCompletion } from './services/geminiService';
import { streamOpenAICompletion } from './services/openaiService';
import { streamAnthropicCompletion } from './services/anthropicService';
import { DEFAULT_MODEL, NEW_CONVERSATION_ID, MODE_PROMPTS, FOLLOW_UP_INSTRUCTION, AVAILABLE_MODELS, DEFAULT_WORKSPACES, DEFAULT_GEMS } from './constants';
import { subscribeToAuth, getUserData, saveUserData } from './services/firebase';
import { User } from 'firebase/auth';

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
    let parsedSettings = saved ? JSON.parse(saved) : {
      theme: 'system',
      model: DEFAULT_MODEL,
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      systemInstruction: '',
      projectContext: ''
    };
    return parsedSettings;
  });

  // UI State
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'canvas'>('chat');
  const [currentId, setCurrentId] = useState<string>(NEW_CONVERSATION_ID);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchMode, setSearchMode] = useState<SearchMode>('concise');
  
  // New Features State
  const [isTemporary, setIsTemporary] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument>({ 
    id: 'default', title: '', content: '', createdAt: Date.now(), updatedAt: Date.now() 
  });
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Derived State
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const currentConversation = conversations.find(c => c.id === currentId) || {
    id: NEW_CONVERSATION_ID,
    title: 'New Search',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const messages = currentConversation.messages;

  // Firebase Auth & Sync Effect
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const cloudData = await getUserData(currentUser.uid);
          if (cloudData) {
            if (cloudData.conversations) setConversations(cloudData.conversations);
            if (cloudData.folders) setFolders(cloudData.folders);
            if (cloudData.settings) {
              setSettings(prev => ({
                ...cloudData.settings,
                apiKey: prev.apiKey || cloudData.settings.apiKey,
                googleApiKey: prev.googleApiKey || cloudData.settings.googleApiKey,
                openaiApiKey: prev.openaiApiKey || cloudData.settings.openaiApiKey,
                anthropicApiKey: prev.anthropicApiKey || cloudData.settings.anthropicApiKey,
              }));
            }
          } else {
            saveUserData(currentUser.uid, {
              conversations,
              folders,
              settings
            });
          }
        } catch (e) {
          console.error("Failed to sync with cloud", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Persistence Effects (Local + Cloud Debounced)
  const persistData = () => {
    // Skip saving if in temporary mode
    if (isTemporary) return;

    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('app_settings', JSON.stringify(settings));

    if (user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveUserData(user.uid, {
          conversations,
          folders,
          settings
        });
      }, 2000); 
    }
  };

  useEffect(() => {
    persistData();
  }, [conversations, folders, settings, user, isTemporary]);

  useEffect(() => {
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Handlers
  const handleNewChat = () => {
    setCurrentId(NEW_CONVERSATION_ID);
    setInput('');
    setCurrentView('chat');
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setConversations(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined } : c));
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = { id: Date.now().toString(), name, createdAt: Date.now(), workspaceId: currentWorkspaceId };
    setFolders(prev => [newFolder, ...prev]);
  };

  const handleMoveToFolder = (convoId: string, folderId?: string) => {
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, folderId } : c));
  };

  const handleClearHistory = () => {
    setConversations([]);
    setFolders([]);
    setCurrentId(NEW_CONVERSATION_ID);
    localStorage.clear();
    if (user) {
      saveUserData(user.uid, { conversations: [], folders: [] });
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    setInput(text);
    handleSubmit(undefined, text); 
  };

  const handleExport = (format: 'txt' | 'json' | 'md') => {
    let content = '';
    const date = new Date().toISOString().split('T')[0];
    const filename = `chat-export-${date}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(currentConversation, null, 2);
    } else {
      content = currentConversation.messages.map(m => {
        const role = m.role.toUpperCase();
        const time = new Date(m.timestamp).toLocaleTimeString();
        return `[${time}] ${role}:\n${m.content}\n\n`;
      }).join('-------------------\n\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectGem = (gem: Gem) => {
    handleNewChat();
    // Pre-seed system instruction for this chat session
    // Since we don't have per-chat system prompt in `messages` state easily accessible without complex logic,
    // we'll just prepend it to the context when sending.
    // Ideally, we'd add a `systemPrompt` field to Conversation.
    // For now, we'll set the global system instruction temporarily, or better:
    // Update input with a "ghost" instruction or switch mode.
    // Let's toggle the system instruction in settings temporarily or just alert user.
    setSettings(prev => ({ ...prev, systemInstruction: gem.systemPrompt }));
    // Ideally we'd show a toast "Gem Activated: [Name]"
  };

  const parseSuggestions = (content: string): { suggestions: string[], cleanContent: string } => {
    const marker = "[[SUGGESTIONS]]";
    const index = content.indexOf(marker);
    if (index === -1) return { suggestions: [], cleanContent: content };

    const suggestionsPart = content.slice(index + marker.length);
    const cleanContent = content.slice(0, index).trim();
    
    const suggestions = suggestionsPart
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .filter(line => line.length > 3 && line.length < 150)
      .slice(0, 3);

    return { suggestions, cleanContent };
  };

  const generateAutoTitle = async (convoId: string, firstQuery: string) => {
    if (!settings.apiKey) return;
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'system', content: 'Generate a 3-5 word concise title for this research query. Reply with ONLY the title.' }, { role: 'user', content: firstQuery }]
        })
      });
      const data = await response.json();
      const title = data.choices?.[0]?.message?.content?.replace(/["']/g, '').trim() || firstQuery;
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title } : c));
    } catch (e) {}
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const query = (overrideInput || input).trim();
    if (!query || isLoading) return;

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === settings.model);
    const provider = modelConfig?.provider || 'perplexity';
    
    let apiKey = '';
    if (provider === 'perplexity') apiKey = settings.apiKey;
    else if (provider === 'google') apiKey = settings.googleApiKey || '';
    else if (provider === 'openai') apiKey = settings.openaiApiKey || '';
    else if (provider === 'anthropic') apiKey = settings.anthropicApiKey || '';

    if (!apiKey) {
      alert(`Please configure your ${provider === 'perplexity' ? 'Perplexity' : provider.charAt(0).toUpperCase() + provider.slice(1)} API Key in settings.`);
      setIsLoading(false);
      return;
    }

    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() };
    const tempId = currentId === NEW_CONVERSATION_ID ? Date.now().toString() : currentId;

    let updatedConversations = [...conversations];
    let activeConvo = updatedConversations.find(c => c.id === tempId);

    if (!activeConvo) {
      activeConvo = {
        id: tempId,
        title: query.slice(0, 30) + '...',
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTemporary: isTemporary,
        workspaceId: currentWorkspaceId
      };
      // Only save if not temporary
      if (!isTemporary) {
         updatedConversations = [activeConvo, ...updatedConversations];
      }
      if (provider === 'perplexity' && !isTemporary) generateAutoTitle(tempId, query);
    } else {
      activeConvo.messages.push(userMsg);
      activeConvo.updatedAt = Date.now();
      if (!isTemporary) {
        updatedConversations = updatedConversations.filter(c => c.id !== tempId);
        updatedConversations.unshift(activeConvo);
      }
    }

    setConversations(updatedConversations);
    setCurrentId(tempId);
    setInput('');
    setIsLoading(true);

    const startTime = Date.now();
    const assistantMsgId = Date.now() + 1;
    const initialAssistantMsg: Message = { 
      role: 'assistant', 
      content: '', 
      timestamp: Date.now(),
      citations: [],
      model: settings.model
    };

    setConversations(prev => {
      const copy = [...prev];
      const target = copy.find(c => c.id === tempId);
      if (target) target.messages.push(initialAssistantMsg);
      // If temporary, we need to handle state differently if it's not in the list (new chat)
      if (isTemporary && !target) {
        // Logic for temp chat state management (simplified for this context)
      }
      return copy;
    });

    abortControllerRef.current = new AbortController();

    const combinedSystem = `
      ${MODE_PROMPTS[searchMode]}
      ${settings.systemInstruction}
      RESEARCH CONTEXT: ${settings.projectContext}
      ${currentView === 'canvas' ? `You are in CANVAS MODE. The user is writing a document. The current document content is:\n${canvasDoc.content}\nProvide helpful edits or content generation.` : ''}
      ${FOLLOW_UP_INSTRUCTION}
    `.trim();

    try {
      let fullContent = '';
      const onChunk = (chunk: string, citations?: string[], usage?: Usage) => {
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
            }
          }
          return copy;
        });

        // Live update canvas if in canvas mode and specific command detected
        if (currentView === 'canvas' && chunk.length > 5) {
           // Simple heuristic: if AI is generating a large block, append to canvas preview? 
           // Better: Let user click "AI Write" in canvas.
        }
      };

      const messagesForApi = activeConvo.messages.filter(m => m.timestamp < assistantMsgId);
      const signal = abortControllerRef.current.signal;

      if (provider === 'perplexity') {
        await streamCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      } else if (provider === 'google') {
        await streamGeminiCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      } else if (provider === 'openai') {
        await streamOpenAICompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      } else if (provider === 'anthropic') {
        await streamAnthropicCompletion(messagesForApi, settings.model, apiKey, onChunk, signal, combinedSystem);
      }

      const { suggestions, cleanContent } = parseSuggestions(fullContent);
      setConversations(prev => {
        const copy = [...prev];
        const target = copy.find(c => c.id === tempId);
        if (target) {
          const lastMsg = target.messages[target.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = cleanContent;
            lastMsg.suggestions = suggestions;
            lastMsg.responseTime = Date.now() - startTime;
          }
        }
        return copy;
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setConversations(prev => {
          const copy = [...prev];
          const target = copy.find(c => c.id === tempId);
          if (target) target.messages[target.messages.length - 1].content += "\n\n**Error:** " + (error.message || "Request failed.");
          return copy;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          conversations={conversations.filter(c => c.workspaceId === currentWorkspaceId || !c.workspaceId)}
          folders={folders.filter(f => f.workspaceId === currentWorkspaceId || !f.workspaceId)}
          currentId={currentId}
          workspaces={DEFAULT_WORKSPACES}
          currentWorkspaceId={currentWorkspaceId}
          gems={DEFAULT_GEMS}
          onSelectWorkspace={setCurrentWorkspaceId}
          onSelectGem={handleSelectGem}
          onSelect={(id) => { setCurrentId(id); setCurrentView('chat'); }}
          onDelete={(id) => setConversations(prev => prev.filter(c => c.id !== id))}
          onNew={handleNewChat}
          onCreateFolder={handleCreateFolder}
          onMoveToFolder={handleMoveToFolder}
          onDeleteFolder={handleDeleteFolder}
          onOpenCanvas={() => { setCurrentView('canvas'); }}
          isAdmin={isAdmin}
          onGoAdmin={() => setCurrentView('admin')}
        />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative">
        {currentView === 'admin' && isAdmin ? (
          <AdminDashboard onBack={() => setCurrentView('chat')} />
        ) : (
          <div className="flex flex-row h-full">
            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${currentView === 'canvas' ? (isCanvasExpanded ? 'w-0 hidden' : 'w-1/2') : 'w-full'}`}>
              <Header 
                isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                settings={settings} setSettings={setSettings} onClearHistory={handleClearHistory}
                user={user}
                isTemporary={isTemporary}
                onToggleTemporary={() => setIsTemporary(!isTemporary)}
                onExport={handleExport}
              />

              <main className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <div className="max-w-2xl w-full space-y-6">
                      <div className="flex justify-center mb-4">
                         <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand-500/20">P</div>
                      </div>
                      <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tight">PerplexSearch Pro</h1>
                      {isTemporary && <span className="inline-block px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold uppercase tracking-widest">Incognito Mode</span>}
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Professional AI research with verified citations.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                         {["Future of AI agents 2025", "Latest findings in fusion energy", "Modern architecture trends in Japan", "Competitive analysis of e-commerce SaaS"].map(q => (
                           <button key={q} onClick={() => { setInput(q); handleSubmit(undefined, q); }} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-sm text-left font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                             {q}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto w-full pb-48 pt-6">
                    <MessageList messages={messages} onSuggestionClick={handleSuggestionClick} />
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

            {/* Canvas Area */}
            {currentView === 'canvas' && (
              <Canvas 
                document={canvasDoc} 
                onUpdate={(content) => setCanvasDoc(prev => ({ ...prev, content, updatedAt: Date.now() }))}
                isExpanded={isCanvasExpanded}
                onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
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
