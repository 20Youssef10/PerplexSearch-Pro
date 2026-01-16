
import React, { useState } from 'react';
import { CustomTool, AppSettings } from '../types';
import { Hammer, Plus, Trash2, Save, X, Globe, Code } from 'lucide-react';

interface ToolbeltPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClose: () => void;
}

export const ToolbeltPanel: React.FC<ToolbeltPanelProps> = ({ settings, setSettings, onClose }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTool, setNewTool] = useState<Partial<CustomTool>>({
      name: '', description: '', url: '', method: 'GET', parameters: '{}'
  });

  const handleSave = () => {
    if (!newTool.name || !newTool.url) return;
    const tool: CustomTool = {
        id: Date.now().toString(),
        name: newTool.name,
        description: newTool.description || '',
        url: newTool.url,
        method: newTool.method as any || 'GET',
        parameters: newTool.parameters || '{}'
    };
    const currentTools = settings.customTools || [];
    setSettings(prev => ({ ...prev, customTools: [...currentTools, tool] }));
    setIsCreating(false);
    setNewTool({ name: '', description: '', url: '', method: 'GET', parameters: '{}' });
  };

  const handleDelete = (id: string) => {
      setSettings(prev => ({ ...prev, customTools: (prev.customTools || []).filter(t => t.id !== id) }));
  };

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                    <Hammer size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">API Toolbelt</h2>
                    <p className="text-xs text-gray-500">Define custom tools for the AI to call.</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
            {isCreating ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
                    <h3 className="font-bold text-lg mb-6">New Tool Definition</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Tool Name</label>
                                <input value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="e.g. GetStockPrice" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Method</label>
                                <select value={newTool.method} onChange={e => setNewTool({...newTool, method: e.target.value as any})} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Endpoint URL</label>
                             <input value={newTool.url} onChange={e => setNewTool({...newTool, url: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 font-mono text-sm" placeholder="https://api.example.com/data" />
                        </div>
                        <div>
                             <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Description (AI Hint)</label>
                             <input value={newTool.description} onChange={e => setNewTool({...newTool, description: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Fetches current stock price for a symbol" />
                        </div>
                        <div>
                             <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Parameters JSON Schema</label>
                             <textarea value={newTool.parameters} onChange={e => setNewTool({...newTool, parameters: e.target.value})} className="w-full h-32 p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 font-mono text-xs" placeholder='{"symbol": {"type": "STRING", "description": "Stock Symbol"}}' />
                        </div>
                        <div className="flex gap-3 pt-4">
                             <button onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-bold">Cancel</button>
                             <button onClick={handleSave} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold">Save Tool</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-600 transition-colors font-bold text-gray-400">
                        <Plus size={20} /> Add New Tool
                    </button>
                    {(settings.customTools || []).map(tool => (
                        <div key={tool.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{tool.name}</h3>
                                    <p className="text-xs text-gray-500">{tool.method} • {tool.url}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(tool.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {(settings.customTools || []).length === 0 && (
                        <div className="text-center text-gray-400 py-10">No custom tools defined yet.</div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
