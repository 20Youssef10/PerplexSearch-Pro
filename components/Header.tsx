
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Menu, X, Trash2, LogIn, User as UserIcon, Download, EyeOff, Sliders, Palette, FileCode, Volume2, Save, Brain, Globe, Plus, Server, Smartphone, Monitor } from 'lucide-react';
import { AppSettings, AppLanguage } from '../types';
import { TRANSLATIONS, AVAILABLE_MODELS } from '../constants';
import { signInWithGoogle, signInWithGithub, signInWithMicrosoft, signInEmail, signUpEmail, signInGuest } from '../services/firebase';
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
  toggleSidebar, settings, setSettings, onClearHistory, user,
  isTemporary, onToggleTemporary, onExport
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'model' | 'api' | 'data' | 'memory'>('profile');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [newMemory, setNewMemory] = useState('');
  
  const t = TRANSLATIONS[settings.interface.language || 'en'];

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800 relative p-6">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4"><X size={20} /></button>
              <h2 className="text-xl font-bold mb-4">Sign In</h2>
              <button onClick={signInWithGoogle} className="w-full border p-2.5 rounded-xl mb-2 text-sm font-bold">Google</button>
              <button onClick={signInGuest} className="w-full border p-2.5 rounded-xl text-sm font-bold">Guest</button>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar shrink-0">
              <h2 className="hidden md:block text-sm font-black text-gray-400 uppercase tracking-widest px-3 mb-2">{t.controlCenter}</h2>
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
