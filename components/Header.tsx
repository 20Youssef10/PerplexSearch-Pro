import React, { useState } from 'react';
import { Settings, Moon, Sun, Menu, X, Check, Trash2, Database, Info } from 'lucide-react';
import { AppSettings } from '../types';
import { PERPLEXITY_MODELS } from '../constants';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClearHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar, settings, setSettings, onClearHistory }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'model' | 'context'>('api');

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
               <button onClick={() => setActiveTab('context')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'context' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>Project Context</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">API Access</label>
                    <input 
                      type="password" 
                      value={settings.apiKey}
                      onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                      placeholder="pplx-..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
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
                <div className="space-y-3">
                  {PERPLEXITY_MODELS.map(model => (
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