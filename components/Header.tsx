
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Menu, X, Trash2, LogIn, User as UserIcon, Download, EyeOff, Sliders, Palette, FileCode, Volume2, Save, Brain, Globe, Plus, Server, Smartphone, Monitor, Loader2, Sparkles, Radio, FileText } from 'lucide-react';
import { AppSettings, AppLanguage } from '../types';
import { TRANSLATIONS, AVAILABLE_MODELS } from '../constants';
import { signInWithGoogle, signInWithGithub, signInWithMicrosoft, signInEmail, signUpEmail, signInGuest } from '../services/firebase';
import { User } from 'firebase/auth';
import { generateTranslation } from '../services/translationService';

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
  onStartLive: () => void;
  onOpenKnowledgeBase: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  toggleSidebar, settings, setSettings, onClearHistory, user,
  isTemporary, onToggleTemporary, onExport, onStartLive, onOpenKnowledgeBase
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'model' | 'api' | 'data' | 'memory'>('profile');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [newMemory, setNewMemory] = useState('');
  
  // Translation UI State
  const [newLangName, setNewLangName] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Compute available languages (Static + Custom)
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    ...Object.keys(settings.customTranslations || {}).map(lang => ({ code: lang, name: lang }))
  ];
  
  const currentLang = settings.interface.language || 'en';
  // Fallback to static or custom
  const t = (TRANSLATIONS as any)[currentLang] || (settings.customTranslations || {})[currentLang] || TRANSLATIONS['en'];

  useEffect(() => {
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      setSettings(prev => ({
        ...prev,
        memories: [...prev.memories, newMemory.trim()]
      }));
      setNewMemory('');
    }
  };

  const handleDeleteMemory = (index: number) => {
    setSettings(prev => ({
      ...prev,
      memories: prev.memories.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateLanguage = async () => {
    if (!newLangName.trim()) return;
    if (!settings.googleApiKey) {
      alert("Please configure your Google Gemini API Key in the API tab to use this feature.");
      return;
    }

    setIsTranslating(true);
    try {
      // Cast to string since we checked for existence above
      const translation = await generateTranslation(newLangName, settings.googleApiKey as string);
      const langCode = newLangName; // Use input name as code for simplicity

      setSettings(prev => ({
        ...prev,
        customTranslations: {
          ...(prev.customTranslations || {}),
          [langCode]: translation
        },
        interface: {
          ...prev.interface,
          language: langCode
        }
      }));
      setNewLangName('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 safe-area-pt">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden text-gray-600 dark:text-gray-300">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/20">P</div>
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight hidden sm:block">PerplexSearch</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {settings.googleApiKey && (
             <button 
                onClick={onStartLive}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 mr-2 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-all animate-in fade-in zoom-in-95"
             >
                <Radio size={14} className="animate-pulse" /> Live
             </button>
          )}

          <button onClick={onOpenKnowledgeBase} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-1" title="Project Knowledge Base">
            <FileText size={18} />
          </button>

          <button onClick={onToggleTemporary} className={`p-2 rounded-lg transition-all mr-1 ${isTemporary ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <EyeOff size={18} />
          </button>

          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Download size={18} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-40 overflow-hidden z-50">
                 {['md', 'txt', 'json'].map(fmt => (
                     <button key={fmt} onClick={() => { onExport(fmt as any); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium uppercase">{fmt}</button>
                 ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 ml-2 cursor-pointer" onClick={() => setShowSettings(true)}>
               {settings.profile.avatarUrl ? <img src={settings.profile.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" /> : <UserIcon size={16} className="text-gray-500" />}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 ml-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95">
              <LogIn size={14} /><span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Auth Modal Simplified */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800 relative p-6 animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              <h2 className="text-xl font-bold mb-6 text-center">Sign In</h2>
              
              <div className="space-y-3">
                <button onClick={signInWithGoogle} className="w-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors text-gray-700 dark:text-gray-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                
                <button onClick={signInWithGithub} className="w-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors text-gray-700 dark:text-gray-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                  GitHub
                </button>
                
                <button onClick={signInWithMicrosoft} className="w-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors text-gray-700 dark:text-gray-200">
                  <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                  Microsoft
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-400 font-bold">Or</span></div>
                </div>

                <button onClick={signInGuest} className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 transition-colors">
                  Continue as Guest
                </button>
              </div>

           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar shrink-0">
              <h2 className="hidden md:block text-sm font-black text-gray-400 uppercase tracking-widest px-3 mb-2">{(t as any).controlCenter || "Control Center"}</h2>
              {['profile', 'memory', 'appearance', 'model', 'api', 'data'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500'}`}>
                   {tab}
                 </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
               <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h2 className="text-lg font-bold dark:text-white capitalize">{activeTab}</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
                 {activeTab === 'profile' && (
                     <div className="space-y-4 max-w-lg">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl">
                                {settings.profile.avatarUrl ? <img src={settings.profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : "👤"}
                            </div>
                        </div>
                        <label className="text-xs font-bold uppercase">Display Name</label>
                        <input value={settings.profile.displayName} onChange={(e) => setSettings({...settings, profile: {...settings.profile, displayName: e.target.value}})} className="w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                        
                        <label className="text-xs font-bold uppercase mt-4 block">Job Title</label>
                        <input value={settings.profile.jobTitle} onChange={(e) => setSettings({...settings, profile: {...settings.profile, jobTitle: e.target.value}})} className="w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                     </div>
                 )}
                 
                 {activeTab === 'memory' && (
                    <div className="space-y-4 max-w-lg">
                      <div className="flex gap-2">
                        <input 
                          value={newMemory} 
                          onChange={(e) => setNewMemory(e.target.value)} 
                          placeholder="Add a fact to remember..." 
                          className="flex-1 p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()} 
                        />
                        <button onClick={handleAddMemory} className="p-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {settings.memories.map((mem, i) => (
                          <div key={i} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group border border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 pr-2">{mem}</p>
                            <button onClick={() => handleDeleteMemory(i)} className="text-gray-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {settings.memories.length === 0 && <div className="text-center p-8 text-gray-400 text-sm">No memories yet. Add key details about yourself or your projects.</div>}
                      </div>
                    </div>
                 )}

                 {activeTab === 'appearance' && (
                     <div className="space-y-6 max-w-lg">
                        <div>
                            <label className="text-xs font-bold uppercase block mb-3">Language</label>
                            <div className="space-y-3">
                              <select
                                  value={settings.interface.language || 'en'}
                                  onChange={(e) => setSettings({...settings, interface: {...settings.interface, language: e.target.value as AppLanguage}})}
                                  className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm font-medium"
                              >
                                  {availableLanguages.map(l => (
                                    <option key={l.code} value={l.code}>{l.name}</option>
                                  ))}
                              </select>
                              
                              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <label className="text-xs font-bold uppercase flex items-center gap-1.5 mb-2 text-brand-600">
                                  <Sparkles size={12} /> Auto-Generate Language
                                </label>
                                <div className="flex gap-2">
                                  <input 
                                    value={newLangName}
                                    onChange={(e) => setNewLangName(e.target.value)}
                                    placeholder="e.g. Italian, Portuguese"
                                    className="flex-1 p-2 rounded-lg border dark:bg-gray-900 dark:border-gray-700 text-xs"
                                  />
                                  <button 
                                    onClick={handleGenerateLanguage}
                                    disabled={isTranslating || !newLangName}
                                    className="px-3 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
                                  >
                                    {isTranslating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">Uses Gemini API to generate app translations on the fly.</p>
                              </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold uppercase block mb-3">Theme</label>
                            <div className="grid grid-cols-3 gap-2">
                            {['light', 'dark', 'system'].map(th => (
                                <button key={th} onClick={() => setSettings({...settings, theme: th as any})} className={`p-3 border rounded-xl capitalize text-sm font-medium flex flex-col items-center gap-2 ${settings.theme === th ? 'bg-brand-50 border-brand-500 text-brand-600 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    {th === 'light' && <Sun size={20} />}
                                    {th === 'dark' && <Moon size={20} />}
                                    {th === 'system' && <Monitor size={20} />}
                                    {th}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                            <h3 className="text-xs font-bold uppercase text-gray-500">Interface</h3>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Font Size</label>
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                    {['small', 'medium', 'large'].map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => setSettings({...settings, interface: {...settings.interface, fontSize: s as any}})}
                                            className={`px-3 py-1 text-xs capitalize rounded-md transition-all ${settings.interface.fontSize === s ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <span className="text-sm font-medium">Compact Mode</span>
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.interface.compactMode ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => setSettings({...settings, interface: {...settings.interface, compactMode: !settings.interface.compactMode}})}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.interface.compactMode ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                            
                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <span className="text-sm font-medium">Code Wrapping</span>
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.interface.codeWrapping ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => setSettings({...settings, interface: {...settings.interface, codeWrapping: !settings.interface.codeWrapping}})}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.interface.codeWrapping ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>

                             <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <span className="text-sm font-medium">Sound Effects</span>
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.interface.soundEnabled ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => setSettings({...settings, interface: {...settings.interface, soundEnabled: !settings.interface.soundEnabled}})}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.interface.soundEnabled ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                        </div>
                     </div>
                 )}

                 {activeTab === 'model' && (
                     <div className="space-y-6 max-w-lg">
                        {/* Model Selection */}
                        <div>
                            <label className="text-xs font-bold uppercase block mb-2">AI Model</label>
                            <select
                              value={settings.model}
                              onChange={(e) => setSettings({...settings, model: e.target.value})}
                              className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm font-medium"
                            >
                                {AVAILABLE_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-2">
                                {AVAILABLE_MODELS.find(m => m.id === settings.model)?.description}
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase block mb-2">System Instruction</label>
                            <textarea value={settings.systemInstruction} onChange={(e) => setSettings({...settings, systemInstruction: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm h-32" placeholder="Define how the AI should behave..." />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-6">
                            <h3 className="text-xs font-bold uppercase text-gray-500">Parameters</h3>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span>Temperature</span>
                                    <span className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 rounded">{settings.modelPreferences.temperature}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.1" 
                                    value={settings.modelPreferences.temperature} 
                                    onChange={(e) => setSettings({...settings, modelPreferences: {...settings.modelPreferences, temperature: parseFloat(e.target.value)}})}
                                    className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Controls randomness: Lower is more deterministic, higher is more creative.</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span>Top P</span>
                                    <span className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 rounded">{settings.modelPreferences.topP}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={settings.modelPreferences.topP} 
                                    onChange={(e) => setSettings({...settings, modelPreferences: {...settings.modelPreferences, topP: parseFloat(e.target.value)}})}
                                    className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Controls diversity via nucleus sampling.</p>
                            </div>
                            
                            <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Text-to-Speech Voice</label>
                                 <select 
                                    value={settings.interface.selectedVoice} 
                                    onChange={(e) => setSettings({...settings, interface: {...settings.interface, selectedVoice: e.target.value}})}
                                    className="w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-sm"
                                 >
                                     <option value="">Default System Voice</option>
                                     {availableVoices.map(v => (
                                         <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                                     ))}
                                 </select>
                             </div>
                        </div>
                     </div>
                 )}

                 {activeTab === 'api' && (
                    <div className="space-y-4 max-w-lg">
                         {['apiKey', 'googleApiKey', 'openaiApiKey', 'anthropicApiKey'].map(key => (
                           <div key={key}>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{key.replace('ApiKey', '')} Key</label>
                              <input type="password" value={(settings as any)[key] || ''} onChange={(e) => setSettings({...settings, [key]: e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" />
                           </div>
                         ))}
                         <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><Server size={12}/> Ollama Base URL</label>
                             <input value={settings.ollamaBaseUrl || 'http://localhost:11434'} onChange={(e) => setSettings({...settings, ollamaBaseUrl: e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" placeholder="http://localhost:11434" />
                         </div>
                         <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><Server size={12}/> OpenAI Base URL (Optional)</label>
                             <input value={settings.openaiBaseUrl || ''} onChange={(e) => setSettings({...settings, openaiBaseUrl: e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" placeholder="https://api.openai.com/v1" />
                             <p className="text-[10px] text-gray-400 mt-1">Use this to route OpenAI requests through a custom proxy to avoid CORS errors.</p>
                         </div>
                         <div className="pt-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><Server size={12}/> Anthropic Base URL (Optional)</label>
                             <input value={settings.anthropicBaseUrl || ''} onChange={(e) => setSettings({...settings, anthropicBaseUrl: e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" placeholder="https://api.anthropic.com/v1" />
                         </div>
                    </div>
                 )}
                 {activeTab === 'data' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                            <h3 className="text-red-800 dark:text-red-200 font-bold text-sm mb-1">Danger Zone</h3>
                            <p className="text-xs text-red-600 dark:text-red-400 mb-4">Once you delete your history, there is no going back. Please be certain.</p>
                            <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-white dark:bg-red-900 text-red-600 dark:text-red-100 border border-red-200 dark:border-red-700 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-800">Clear All History</button>
                        </div>
                    </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
      {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
             <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl max-w-xs w-full">
                 <p className="mb-4 font-bold text-center">Delete all conversation history?</p>
                 <div className="flex gap-2">
                    <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 font-medium">Cancel</button>
                    <button onClick={() => { onClearHistory(); setShowClearConfirm(false); }} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">Delete</button>
                 </div>
             </div>
          </div>
      )}
    </>
  );
};
