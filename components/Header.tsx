
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Menu, X, Trash2, LogIn, User as UserIcon, Download, EyeOff, Sliders, Palette, FileCode, Volume2, Save, Brain, Globe, Plus, Server } from 'lucide-react';
import { AppSettings, AppLanguage } from '../types';
import { TRANSLATIONS } from '../constants';
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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const t = TRANSLATIONS[settings.interface.language || 'en'];

  useEffect(() => {
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
              <h2 className="hidden md:block text-sm font-black text-gray-400 uppercase tracking-widest px-3 mb-2">{t.controlCenter}</h2>
              {['profile', 'memory', 'appearance', 'model', 'api', 'data'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold capitalize ${activeTab === tab ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500'}`}>
                   {tab}
                 </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
               <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h2 className="text-lg font-bold dark:text-white capitalize">{activeTab}</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6">
                 {activeTab === 'profile' && (
                     <div className="space-y-4 max-w-lg">
                        <label className="text-xs font-bold uppercase">Display Name</label>
                        <input value={settings.profile.displayName} onChange={(e) => setSettings({...settings, profile: {...settings.profile, displayName: e.target.value}})} className="w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                     </div>
                 )}
                 {activeTab === 'appearance' && (
                     <div className="space-y-4 max-w-lg">
                        <label className="text-xs font-bold uppercase">Theme</label>
                        <div className="flex gap-2">
                           {['light', 'dark', 'system'].map(th => (
                              <button key={th} onClick={() => setSettings({...settings, theme: th as any})} className={`p-2 border rounded-lg capitalize ${settings.theme === th ? 'bg-brand-50 border-brand-500 text-brand-600' : ''}`}>{th}</button>
                           ))}
                        </div>
                     </div>
                 )}
                 {activeTab === 'model' && (
                     <div className="space-y-4 max-w-lg">
                        <label className="text-xs font-bold uppercase">System Instruction</label>
                        <textarea value={settings.systemInstruction} onChange={(e) => setSettings({...settings, systemInstruction: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700" rows={4} />
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
                    <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm">Clear History</button>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
      {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
             <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                 <p className="mb-4 font-bold">Delete all history?</p>
                 <div className="flex gap-2">
                    <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                    <button onClick={() => { onClearHistory(); setShowClearConfirm(false); }} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
                 </div>
             </div>
          </div>
      )}
    </>
  );
};
