
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Menu, X, Check, Trash2, Info, LogIn, LogOut, User as UserIcon, Mail, UserPlus, Shield, Download, EyeOff, Github, UserCog, Sliders, Palette, FileCode, Volume2, Save } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { AVAILABLE_MODELS } from '../constants';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'model' | 'api' | 'data'>('profile');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Sync Firebase User to Profile if empty
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

  // Group models by provider
  const modelsByProvider = AVAILABLE_MODELS.reduce((acc, model) => {
    acc[model.provider] = acc[model.provider] || [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODELS>);

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
      console.error(err);
      // Handle "Account exists with different credential" error
      if (err.code === 'auth/account-exists-with-different-credential') {
        setAuthError("An account with this email already exists using a different sign-in method (likely Google or Email). Please sign in with that method.");
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
      console.error(err);
      // Handle configuration errors (Invalid Client Secret)
      if (err.message && err.message.includes('Invalid client secret')) {
        setAuthError("Configuration Error: Microsoft Login is currently unavailable due to server configuration (Invalid Secret). Please use another method.");
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
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight">PerplexSearch</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTemporary}
            className={`p-2 rounded-lg transition-all mr-2 ${isTemporary ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title={isTemporary ? "Incognito Mode On (Chats not saved)" : "Enable Incognito Mode"}
          >
            <EyeOff size={18} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Export Chat"
            >
              <Download size={18} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-40 overflow-hidden animate-in fade-in zoom-in-95 z-50">
                 <button onClick={() => { onExport('md'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">Markdown (.md)</button>
                 <button onClick={() => { onExport('txt'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">Text (.txt)</button>
                 <button onClick={() => { onExport('json'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium">JSON</button>
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 ml-2">
               {settings.profile.avatarUrl ? (
                 <img src={settings.profile.avatarUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
               ) : (
                 <UserIcon size={16} className="text-gray-500" />
               )}
               <span className="text-xs font-medium max-w-[80px] truncate">{settings.profile.displayName || user.email || 'Guest'}</span>
               <button onClick={() => signOut()} title="Sign Out" className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                 <LogOut size={14} />
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 mr-2 ml-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-brand-500/20 active:scale-95"
            >
              <LogIn size={14} />
              <span>Sign In</span>
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
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800 relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                 <X size={20} />
              </button>
              
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={24} />
                 </div>
                 <h2 className="text-xl font-bold mb-1 dark:text-white">{authMode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Sign in to sync your search history across devices.</p>

                 {authError && (
                   <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-lg border border-red-100 dark:border-red-800 text-left">
                     <strong className="block font-bold mb-0.5">Authentication Error:</strong>
                     {authError}
                   </div>
                 )}

                 <div className="space-y-3 mb-6">
                    <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-200">
                       <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                       Continue with Google
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleMicrosoftAuth} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-200">
                         <svg className="w-4 h-4" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                         Microsoft
                      </button>
                      <button onClick={handleGithubAuth} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-200">
                         <Github size={16} className="text-gray-900 dark:text-white" />
                         GitHub
                      </button>
                    </div>

                    <button onClick={handleGuestAuth} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-200">
                       <Shield size={14} className="text-gray-400" />
                       Continue as Guest
                    </button>
                 </div>

                 <div className="flex items-center gap-2 mb-6 opacity-50">
                    <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Or with Email</span>
                    <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                 </div>

                 <form onSubmit={handleEmailAuth} className="space-y-3">
                    <div className="relative">
                       <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                       <input 
                          type="email" 
                          placeholder="Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                          required
                       />
                    </div>
                    <div className="relative">
                       <UserPlus size={16} className="absolute left-3 top-3 text-gray-400" />
                       <input 
                          type="password" 
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                          required
                          minLength={6}
                       />
                    </div>
                    <button 
                       type="submit" 
                       disabled={isAuthLoading}
                       className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
                    >
                       {isAuthLoading ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         authMode === 'signin' ? 'Sign In' : 'Create Account'
                       )}
                    </button>
                 </form>

                 <div className="mt-4 text-xs text-gray-500">
                    {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                       onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                       className="text-brand-600 font-bold hover:underline"
                    >
                       {authMode === 'signin' ? 'Sign Up' : 'Log In'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Expanded Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Control Center</h2>
              
              <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <UserCog size={18} /> Profile & Bio
              </button>
              <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'appearance' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Palette size={18} /> Appearance
              </button>
              <button onClick={() => setActiveTab('model')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'model' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Sliders size={18} /> Model Config
              </button>
              <button onClick={() => setActiveTab('api')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'api' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <FileCode size={18} /> API Keys
              </button>
              <button onClick={() => setActiveTab('data')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Save size={18} /> Data Management
              </button>
            </div>

            {/* Main Content */}
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
                            className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                          <input 
                            type="text" 
                            value={settings.profile.displayName}
                            onChange={(e) => setSettings({...settings, profile: {...settings.profile, displayName: e.target.value}})}
                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Title / Role</label>
                          <input 
                            type="text" 
                            value={settings.profile.jobTitle}
                            onChange={(e) => setSettings({...settings, profile: {...settings.profile, jobTitle: e.target.value}})}
                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium"
                            placeholder="e.g. Senior Engineer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User Bio & Context</label>
                        <p className="text-[10px] text-gray-400 mb-2">This is injected into the system prompt to help the AI understand who you are.</p>
                        <textarea 
                          rows={4}
                          value={settings.profile.bio}
                          onChange={(e) => setSettings({...settings, profile: {...settings.profile, bio: e.target.value}})}
                          className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                          placeholder="I prefer concise answers. I'm knowledgeable about Python but new to Rust..."
                        />
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
                            <button
                              key={t}
                              onClick={() => setSettings({...settings, theme: t})}
                              className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${settings.theme === t ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                              {t === 'light' ? <Sun size={16}/> : t === 'dark' ? <Moon size={16}/> : <Sliders size={16}/>}
                              {t.toUpperCase()}
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
                   <div className="space-y-8 max-w-xl">
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

                 {/* API KEYS TAB */}
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
                               value={(settings as any)[key] || ''}
                               onChange={(e) => setSettings({...settings, [key]: e.target.value})}
                               className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono"
                               placeholder="sk-..."
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
