import React, { useState } from 'react';
import { Settings, Moon, Sun, Menu, X, Check, Trash2, Info, LogIn, LogOut, User as UserIcon, Mail, UserPlus, Shield } from 'lucide-react';
import { AppSettings } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import { signInWithGoogle, signInEmail, signUpEmail, signInGuest, signOut } from '../services/firebase';
import { User } from 'firebase/auth';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClearHistory: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar, settings, setSettings, onClearHistory, user }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'model' | 'context'>('api');

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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
      setAuthError("Google Sign-In failed");
    }
  };

  const handleGuestAuth = async () => {
    setAuthError(null);
    try {
      await signInGuest();
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError("Guest login failed");
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
          {user ? (
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
               {user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
               ) : (
                 <UserIcon size={16} className="text-gray-500" />
               )}
               <span className="text-xs font-medium max-w-[80px] truncate">{user.displayName || user.email || 'Guest'}</span>
               <button onClick={() => signOut()} title="Sign Out" className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                 <LogOut size={14} />
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 mr-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-brand-500/20 active:scale-95"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          <button 
            onClick={() => setSettings({...settings, theme: settings.theme === 'dark' ? 'light' : 'dark'})}
            className="p-2 text-gray-400 hover:text-brand-600 transition-colors"
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
                   <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-lg border border-red-100 dark:border-red-800">
                     {authError}
                   </div>
                 )}

                 <div className="space-y-3 mb-6">
                    <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-200">
                       <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                       Continue with Google
                    </button>
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

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-brand-600" />
                <h2 className="font-semibold dark:text-white">Professional Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-100 dark:border-gray-800">
               <button onClick={() => setActiveTab('api')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'api' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>General</button>
               <button onClick={() => setActiveTab('model')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'model' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>Model</button>
               <button onClick={() => setActiveTab('context')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'context' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>Context</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Perplexity API Key</label>
                    <input 
                      type="password" 
                      value={settings.apiKey}
                      onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                      placeholder="pplx-..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Google Gemini API Key</label>
                    <input 
                      type="password" 
                      value={settings.googleApiKey || ''}
                      onChange={(e) => setSettings({...settings, googleApiKey: e.target.value})}
                      placeholder="AIza..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">OpenAI API Key</label>
                    <input 
                      type="password" 
                      value={settings.openaiApiKey || ''}
                      onChange={(e) => setSettings({...settings, openaiApiKey: e.target.value})}
                      placeholder="sk-..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Anthropic API Key</label>
                    <input 
                      type="password" 
                      value={settings.anthropicApiKey || ''}
                      onChange={(e) => setSettings({...settings, anthropicApiKey: e.target.value})}
                      placeholder="sk-ant-..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400">Note: Browser requests to Anthropic may require a proxy.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Appearance</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSettings({...settings, theme: t})}
                          className={`p-2 rounded-xl border text-xs font-medium transition-all ${settings.theme === t ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30' : 'border-gray-200'}`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                     <button onClick={() => setShowClearConfirm(true)} className="w-full text-red-500 text-xs font-bold uppercase py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">Nuclear Clear: Delete All History</button>
                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="space-y-6">
                  {Object.entries(modelsByProvider).map(([provider, models]) => (
                    <div key={provider}>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{provider}</h3>
                      <div className="space-y-2">
                        {models.map(model => (
                          <button
                            key={model.id}
                            onClick={() => setSettings({...settings, model: model.id})}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${settings.model === model.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{model.name}</span>
                              {settings.model === model.id && <Check size={14} className="text-brand-600" />}
                            </div>
                            <span className="text-[10px] text-gray-500 leading-relaxed">{model.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'context' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                    <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 dark:text-blue-300">
                      Project Context is persistent instructions that the AI will always remember across all your searches. Ideal for setting a "Knowledge Base" for a specific project.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Context / Knowledge Base</label>
                    <textarea 
                      value={settings.projectContext}
                      onChange={(e) => setSettings({...settings, projectContext: e.target.value})}
                      placeholder="Tell the AI about your company, current goals, or specific guidelines..."
                      rows={8}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {showClearConfirm && (
              <div className="absolute inset-0 z-10 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
                 <Trash2 size={48} className="text-red-500 mb-4" />
                 <h3 className="font-bold text-lg mb-2">Delete Everything?</h3>
                 <p className="text-sm text-gray-500 mb-6">This action is irreversible. All conversations and folders will be gone forever.</p>
                 <div className="flex gap-3 w-full max-w-xs">
                    <button onClick={onClearHistory} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl">DELETE</button>
                    <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 font-bold py-2 rounded-xl">CANCEL</button>
                 </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};