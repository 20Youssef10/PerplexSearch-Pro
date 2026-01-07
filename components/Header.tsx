
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Menu, X, Check, Trash2, Info, LogIn, LogOut, User as UserIcon, Mail, UserPlus, Shield, Download, EyeOff, Github, UserCog, Sliders, Palette, FileCode, Volume2, Save, Brain, Globe, Plus } from 'lucide-react';
import { AppSettings, UserProfile, AppLanguage } from '../types';
import { AVAILABLE_MODELS, TRANSLATIONS } from '../constants';
import { signInWithGoogle, signInWithGithub, signInWithMicrosoft, signInEmail, signUpEmail, signInGuest, signOut } from '../services/firebase';
import { User } from 'firebase/auth';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClearHistory: () => void;
  user: User | null;
  isTemporary: boolean;
  onToggleTemporary: () => void;
  onExport: (format: 'txt' | 'json' | 'md') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isSidebarOpen, toggleSidebar, settings, setSettings, onClearHistory, user,
  isTemporary, onToggleTemporary, onExport
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'model' | 'api' | 'data' | 'memory'>('profile');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [newMemory, setNewMemory] = useState('');

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const t = TRANSLATIONS[settings.interface.language || 'en'];

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (user && !settings.profile.displayName) {
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          displayName: user.displayName || 'User',
          avatarUrl: user.photoURL || ''
        }
      }));
    }
  }, [user]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await signUpEmail(email, password);
      } else {
        await signInEmail(email, password);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || "Google Sign-In failed";
      setAuthError(msg);
    }
  };

  const handleGithubAuth = async () => {
    setAuthError(null);
    try {
      await signInWithGithub();
      setShowAuthModal(false);
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setAuthError("An account with this email already exists using a different sign-in method. Please sign in with that method.");
      } else {
        const msg = err.message?.replace('Firebase: ', '') || "GitHub Sign-In failed";
        setAuthError(msg);
      }
    }
  };

  const handleMicrosoftAuth = async () => {
    setAuthError(null);
    try {
      await signInWithMicrosoft();
      setShowAuthModal(false);
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid client secret')) {
        setAuthError("Configuration Error: Microsoft Login unavailable (Invalid Secret).");
      } else {
        const msg = err.message?.replace('Firebase: ', '') || "Microsoft Sign-In failed";
        setAuthError(msg);
      }
    }
  };

  const handleGuestAuth = async () => {
    setAuthError(null);
    try {
      await signInGuest();
      setShowAuthModal(false);
    } catch (err: any) {
      const msg = err.message?.replace('Firebase: ', '') || "Guest login failed";
      setAuthError(msg);
    }
  };

  const addMemory = () => {
    if (!newMemory.trim()) return;
    setSettings(prev => ({
        ...prev,
        memories: [...(prev.memories || []), newMemory.trim()]
    }));
    setNewMemory('');
  };

  const removeMemory = (idx: number) => {
    setSettings(prev => ({
        ...prev,
        memories: prev.memories.filter((_, i) => i !== idx)
    }));
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden text-gray-600 dark:text-gray-300"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/20">
              P
            </div>
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight hidden sm:block">PerplexSearch</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <div className="hidden md:block relative group mr-2">
             <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Globe size={18}/></button>
             <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block p-1">
                {['en', 'es', 'fr', 'de', 'ja', 'zh'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setSettings(s => ({...s, interface: {...s.interface, language: lang as AppLanguage}}))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase ${settings.interface.language === lang ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {lang}
                    </button>
                ))}
             </div>
          </div>

          <button
            onClick={onToggleTemporary}
            className={`p-2 rounded-lg transition-all mr-1 ${isTemporary ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <EyeOff size={18} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Download size={18} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-40 overflow-hidden z-50">
                 <button onClick={() => { onExport('md'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">Markdown (.md)</button>
                 <button onClick={() => { onExport('txt'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">Text (.txt)</button>
                 <button onClick={() => { onExport('json'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">JSON</button>
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 ml-2 cursor-pointer" onClick={() => setShowSettings(true)}>
               {settings.profile.avatarUrl ? (
                 <img src={settings.profile.avatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
               ) : (
                 <UserIcon size={16} className="text-gray-500" />
               )}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 ml-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-brand-600 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800 relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              <div className="p-6 text-center">
                 <h2 className="text-xl font-bold mb-4 dark:text-white">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                 {authError && <div className="mb-4 text-red-500 text-xs">{authError}</div>}
                 
                 <div className="space-y-2 mb-4">
                   <button onClick={handleGoogleAuth} className="w-full border p-2.5 rounded-xl dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">Continue with Google</button>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={handleMicrosoftAuth} className="w-full border p-2.5 rounded-xl dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">Microsoft</button>
                     <button onClick={handleGithubAuth} className="w-full border p-2.5 rounded-xl dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">GitHub</button>
                   </div>
                   <button onClick={handleGuestAuth} className="w-full border p-2.5 rounded-xl dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">Continue as Guest</button>
                 </div>

                 <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or with Email</span></div>
                 </div>

                 <form onSubmit={handleEmailAuth} className="space-y-3">
                    <input 
                       type="email" 
                       placeholder="Email" 
                       value={email} onChange={e => setEmail(e.target.value)}
                       className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                    />
                    <input 
                       type="password" 
                       placeholder="Password" 
                       value={password} onChange={e => setPassword(e.target.value)}
                       className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                    />
                    <button type="submit" disabled={isAuthLoading} className="w-full bg-brand-600 text-white p-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors">
                       {isAuthLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                    </button>
                 </form>
                 
                 <div className="mt-4 text-xs text-gray-500">
                    <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-brand-600 hover:underline">
                       {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row">
            
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
              <h2 className="hidden md:block text-sm font-black text-gray-400 uppercase tracking-widest px-3 mb-2">{t.controlCenter}</h2>
              
              <button onClick={() => setActiveTab('profile')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <UserCog size={18} /> <span className="hidden md:inline">Profile</span>
              </button>
              <button onClick={() => setActiveTab('memory')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'memory' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Brain size={18} /> <span className="hidden md:inline">Memory</span>
              </button>
              <button onClick={() => setActiveTab('appearance')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'appearance' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Palette size={18} /> <span className="hidden md:inline">Appearance</span>
              </button>
              <button onClick={() => setActiveTab('model')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'model' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Sliders size={18} /> <span className="hidden md:inline">Model</span>
              </button>
              <button onClick={() => setActiveTab('api')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'api' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <FileCode size={18} /> <span className="hidden md:inline">API Keys</span>
              </button>
              <button onClick={() => setActiveTab('data')} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Save size={18} /> <span className="hidden md:inline">Data</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h2 className="text-lg font-bold dark:text-white capitalize">{activeTab.replace('api', 'API Keys')}</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-gray-400">
                   <X size={20} />
                 </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6">
                 
                 {/* PROFILE TAB */}
                 {activeTab === 'profile' && (
                     <div className="space-y-6 max-w-lg">
                        <div className="flex items-center gap-4">
                           <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border-2 border-brand-500">
                             {settings.profile.avatarUrl ? (
                               <img src={settings.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                             )}
                           </div>
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avatar URL</label>
                             <input 
                               type="text" 
                               value={settings.profile.avatarUrl}
                               onChange={(e) => setSettings({...settings, profile: {...settings.profile, avatarUrl: e.target.value}})}
                               className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                               placeholder="https://..."
                             />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                            <input 
                              placeholder="Name" 
                              value={settings.profile.displayName} 
                              onChange={(e) => setSettings({...settings, profile: {...settings.profile, displayName: e.target.value}})}
                              className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Title</label>
                            <input 
                              placeholder="e.g. Engineer" 
                              value={settings.profile.jobTitle} 
                              onChange={(e) => setSettings({...settings, profile: {...settings.profile, jobTitle: e.target.value}})}
                              className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Context</label>
                           <textarea 
                             rows={4}
                             value={settings.profile.bio}
                             onChange={(e) => setSettings({...settings, profile: {...settings.profile, bio: e.target.value}})}
                             className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                             placeholder="A short bio that AI can use to personalize answers..."
                           />
                        </div>
                     </div>
                 )}

                 {/* MEMORY TAB */}
                 {activeTab === 'memory' && (
                    <div className="space-y-6 max-w-lg">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                            <h3 className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm mb-1"><Brain size={16}/> User Memory</h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Facts stored here are injected into every conversation context.</p>
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                value={newMemory}
                                onChange={(e) => setNewMemory(e.target.value)}
                                className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="e.g. 'I prefer code in Python' or 'I am a visual learner'"
                                onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                            />
                            <button onClick={addMemory} className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700"><Plus size={18}/></button>
                        </div>

                        <div className="space-y-2">
                            {(settings.memories || []).map((mem, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl group">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{mem}</span>
                                    <button onClick={() => removeMemory(i)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            {(settings.memories || []).length === 0 && (
                                <p className="text-center text-gray-400 text-xs py-4">No memories stored yet.</p>
                            )}
                        </div>
                    </div>
                 )}

                 {/* APPEARANCE TAB */}
                 {activeTab === 'appearance' && (
                    <div className="space-y-6 max-w-lg">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Theme</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['light', 'dark', 'system'] as const).map((t) => (
                              <button key={t} onClick={() => setSettings({...settings, theme: t})} className={`p-3 rounded-xl border text-sm capitalize flex items-center justify-center gap-2 ${settings.theme === t ? 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Settings size={14} />} {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                             <span className="text-sm font-medium">Compact Mode</span>
                             <button onClick={() => setSettings(s => ({...s, interface: {...s.interface, compactMode: !s.interface.compactMode}}))} className={`w-10 h-6 rounded-full transition-colors relative ${settings.interface.compactMode ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.interface.compactMode ? 'translate-x-4' : ''}`} />
                             </button>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                             <span className="text-sm font-medium">Sound Effects</span>
                             <button onClick={() => setSettings(s => ({...s, interface: {...s.interface, soundEnabled: !s.interface.soundEnabled}}))} className={`w-10 h-6 rounded-full transition-colors relative ${settings.interface.soundEnabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.interface.soundEnabled ? 'translate-x-4' : ''}`} />
                             </button>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                             <span className="text-sm font-medium">Wrap Code Blocks</span>
                             <button onClick={() => setSettings(s => ({...s, interface: {...s.interface, codeWrapping: !s.interface.codeWrapping}}))} className={`w-10 h-6 rounded-full transition-colors relative ${settings.interface.codeWrapping ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.interface.codeWrapping ? 'translate-x-4' : ''}`} />
                             </button>
                          </div>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Text-to-Speech Voice</label>
                           <div className="relative">
                              <Volume2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
                              <select 
                                value={settings.interface.selectedVoice}
                                onChange={(e) => setSettings(s => ({...s, interface: {...s.interface, selectedVoice: e.target.value}}))}
                                className="w-full pl-10 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none appearance-none"
                              >
                                <option value="">Default System Voice</option>
                                {availableVoices.map(v => (
                                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                                ))}
                              </select>
                           </div>
                        </div>
                    </div>
                 )}

                 {/* MODEL TAB */}
                 {activeTab === 'model' && (
                    <div className="space-y-6 max-w-xl">
                       <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Primary Model</label>
                         <select 
                           value={settings.model}
                           onChange={(e) => setSettings({...settings, model: e.target.value})}
                           className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold shadow-sm"
                         >
                           {AVAILABLE_MODELS.map(m => (
                             <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                           ))}
                         </select>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div>
                             <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Temperature</label>
                                <span className="text-xs font-mono">{settings.modelPreferences.temperature}</span>
                             </div>
                             <input 
                               type="range" min="0" max="2" step="0.1"
                               value={settings.modelPreferences.temperature}
                               onChange={(e) => setSettings(s => ({...s, modelPreferences: {...s.modelPreferences, temperature: parseFloat(e.target.value)}}))}
                               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                             />
                          </div>
                          <div>
                             <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Top P</label>
                                <span className="text-xs font-mono">{settings.modelPreferences.topP}</span>
                             </div>
                             <input 
                               type="range" min="0" max="1" step="0.05"
                               value={settings.modelPreferences.topP}
                               onChange={(e) => setSettings(s => ({...s, modelPreferences: {...s.modelPreferences, topP: parseFloat(e.target.value)}}))}
                               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                             />
                          </div>
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Global System Instructions</label>
                         <textarea 
                           rows={4}
                           value={settings.systemInstruction}
                           onChange={(e) => setSettings({...settings, systemInstruction: e.target.value})}
                           className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono"
                           placeholder="You are a helpful assistant..."
                         />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Per-Model Instructions</label>
                          <p className="text-[10px] text-gray-400 mb-2">Instructions specific to the currently selected model ({settings.model}).</p>
                          <textarea 
                            rows={3}
                            value={settings.modelPreferences.customInstructions[settings.model] || ''}
                            onChange={(e) => setSettings(s => ({
                              ...s, 
                              modelPreferences: {
                                ...s.modelPreferences, 
                                customInstructions: {
                                  ...s.modelPreferences.customInstructions,
                                  [settings.model]: e.target.value
                                }
                              }
                            }))}
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono"
                            placeholder={`Specific instructions for ${settings.model}...`}
                          />
                       </div>
                    </div>
                 )}
                 
                 {/* API TAB */}
                 {activeTab === 'api' && (
                    <div className="space-y-4 max-w-lg">
                         <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                           Your API keys are stored locally in your browser and synced only to your private Firestore data if signed in.
                         </div>
                         {['apiKey', 'googleApiKey', 'openaiApiKey', 'anthropicApiKey'].map(key => {
                             const labels: Record<string, string> = {
                               apiKey: 'Perplexity API Key',
                               googleApiKey: 'Google Gemini API Key',
                               openaiApiKey: 'OpenAI API Key',
                               anthropicApiKey: 'Anthropic API Key'
                             };
                             return (
                               <div key={key}>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{labels[key]}</label>
                                  <input 
                                    type="password"
                                    placeholder="sk-..."
                                    value={(settings as any)[key] || ''}
                                    onChange={(e) => setSettings({...settings, [key]: e.target.value})}
                                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono"
                                  />
                               </div>
                             );
                         })}
                    </div>
                 )}

                 {/* DATA TAB */}
                 {activeTab === 'data' && (
                    <div className="space-y-6 max-w-lg">
                       <div>
                         <h3 className="text-sm font-bold mb-2">Project Knowledge Base</h3>
                         <p className="text-xs text-gray-500 mb-2">Context shared across all conversations in this project.</p>
                         <textarea 
                            rows={6}
                            value={settings.projectContext}
                            onChange={(e) => setSettings({...settings, projectContext: e.target.value})}
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                            placeholder="Long-term context about your project, company, or goals..."
                          />
                       </div>
                       
                       <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                          <h3 className="text-sm font-bold text-red-500 mb-2">Danger Zone</h3>
                          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-bold">
                             <Trash2 size={16} />
                             Clear All Conversation History
                          </button>
                       </div>
                    </div>
                 )}

               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                 <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Confirm Deletion</h3>
                 <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete all history? This cannot be undone.</p>
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold">Cancel</button>
                    <button onClick={() => { onClearHistory(); setShowClearConfirm(false); }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold">Delete All</button>
                 </div>
             </div>
          </div>
      )}
    </>
  );
};
