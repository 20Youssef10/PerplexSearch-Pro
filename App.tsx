import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { SearchInput } from './components/SearchInput';
import { Message, Conversation, Folder, SearchMode, AppSettings, Usage } from './types';
import { streamCompletion } from './services/perplexityService';
import { streamGeminiCompletion } from './services/geminiService';
import { streamOpenAICompletion } from './services/openaiService';
import { streamAnthropicCompletion } from './services/anthropicService';
import { DEFAULT_MODEL, NEW_CONVERSATION_ID, MODE_PROMPTS, FOLLOW_UP_INSTRUCTION, AVAILABLE_MODELS } from './constants';
import { subscribeToAuth, getUserData, saveUserData } from './services/firebase';
import { User } from 'firebase/auth';

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
  const [currentId, setCurrentId] = useState<string>(NEW_CONVERSATION_ID);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchMode, setSearchMode] = useState<SearchMode>('concise');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Derived State
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
  }, [conversations, folders, settings, user]);

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
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setConversations(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined } : c));
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = { id: Date.now().toString(), name, createdAt: Date.now() };
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
    // We can stick to Perplexity for titling if available, or just skip if no Perplexity key
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
    } catch (e) {
      // Fail silently for auto-titling
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const query = (overrideInput || input).trim();
    if (!query || isLoading) return;

    // Determine Provider and Key
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

    const userMsg: Message = { 
        role: 'user', 
        content: query, 
        timestamp: Date.now()
    };
    
    const tempId = currentId === NEW_CONVERSATION_ID ? Date.now().toString() : currentId;

    let updatedConversations = [...conversations];
    let activeConvo = updatedConversations.find(c => c.id === tempId);

    if (!activeConvo) {
      activeConvo = {
        id: tempId,
        title: query.slice(0, 30) + '...',
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      updatedConversations = [activeConvo, ...updatedConversations];
      if (provider === 'perplexity') generateAutoTitle(tempId, query);
    } else {
      activeConvo.messages.push(userMsg);
      activeConvo.updatedAt = Date.now();
      updatedConversations = updatedConversations.filter(c => c.id !== tempId);
      updatedConversations.unshift(activeConvo);
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
      return copy;
    });

    abortControllerRef.current = new AbortController();

    const combinedSystem = `
      ${MODE_PROMPTS[searchMode]}
      ${settings.systemInstruction}
      RESEARCH CONTEXT: ${settings.projectContext}
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

      // Post-process response to extract suggestions
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
        console.error(error);
        setConversations(prev => {
          const copy = [...prev];
          const target = copy.find(c => c.id === tempId);
          if (target) {
            target.messages[target.messages.length - 1].content += "\n\n**Error:** " + (error.message || "Request failed.");
          }
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
          conversations={conversations}
          folders={folders}
          currentId={currentId}
          onSelect={setCurrentId}
          onDelete={(id) => setConversations(prev => prev.filter(c => c.id !== id))}
          onNew={handleNewChat}
          onCreateFolder={handleCreateFolder}
          onMoveToFolder={handleMoveToFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative">
        <Header 
          isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          settings={settings} setSettings={setSettings} onClearHistory={handleClearHistory}
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="max-w-2xl w-full space-y-6">
                <div className="flex justify-center mb-4">
                   <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand-500/20">P</div>
                </div>
                <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tight">PerplexSearch Pro</h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">AI-powered deep research engine with cited knowledge.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                   {["The future of AI agents in 2025", "Latest findings in deep space exploration", "Explain quantum computing visually", "Top open source alternatives to popular SaaS"].map(q => (
                     <button key={q} onClick={() => { setInput(q); handleSubmit(undefined, q); }} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-sm text-left font-medium text-gray-600 dark:text-gray-300">
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
    </div>
  );
};

export default App;