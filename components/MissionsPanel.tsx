
import React, { useState } from 'react';
import { Mission, AppSettings } from '../types';
import { Rocket, Play, Pause, Trash2, Clock, Plus, X, Search } from 'lucide-react';

interface MissionsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onRunMission: (mission: Mission) => void;
  onClose: () => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({ settings, setSettings, onRunMission, onClose }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newMission, setNewMission] = useState<Partial<Mission>>({
    title: '', frequency: 'weekly', prompt: '', status: 'active'
  });

  const handleCreate = () => {
    if (!newMission.title || !newMission.prompt) return;
    const mission: Mission = {
        id: Date.now().toString(),
        title: newMission.title,
        description: newMission.description || '',
        frequency: newMission.frequency as any || 'weekly',
        status: 'active',
        prompt: newMission.prompt,
    };
    const currentMissions = settings.missions || [];
    setSettings(prev => ({ ...prev, missions: [...currentMissions, mission] }));
    setIsCreating(false);
    setNewMission({ title: '', frequency: 'weekly', prompt: '', status: 'active' });
  };

  const handleDelete = (id: string) => {
    setSettings(prev => ({ ...prev, missions: (prev.missions || []).filter(m => m.id !== id) }));
  };

  const missions = settings.missions || [];

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-10 duration-300 flex flex-col">
       <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
           <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                   <Rocket size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Research Missions</h2>
                   <p className="text-xs text-gray-500">Automated recurring research tasks and briefings.</p>
               </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={24} /></button>
       </div>

       <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
           
           {!isCreating ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <button onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group min-h-[200px]">
                       <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform text-indigo-500">
                           <Plus size={32} />
                       </div>
                       <span className="font-bold text-gray-500 dark:text-gray-400">Create New Mission</span>
                   </button>

                   {missions.map(mission => (
                       <div key={mission.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all relative group">
                           <div className="flex justify-between items-start mb-4">
                               <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${mission.frequency === 'daily' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                   {mission.frequency}
                               </div>
                               <button onClick={() => handleDelete(mission.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                           </div>
                           <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">{mission.title}</h3>
                           <p className="text-xs text-gray-500 mb-6 line-clamp-2">{mission.prompt}</p>
                           
                           <div className="flex items-center justify-between mt-auto">
                               <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                   <Clock size={12} /> Last run: {mission.lastRun ? new Date(mission.lastRun).toLocaleDateString() : 'Never'}
                               </span>
                               <button 
                                 onClick={() => onRunMission(mission)}
                                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                               >
                                   <Play size={14} /> Run Now
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           ) : (
               <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 animate-in zoom-in-95">
                   <h3 className="text-xl font-bold mb-6">Configure Mission</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mission Title</label>
                           <input value={newMission.title} onChange={e => setNewMission({...newMission, title: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700" placeholder="e.g. Weekly Crypto Report" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frequency</label>
                           <select value={newMission.frequency} onChange={e => setNewMission({...newMission, frequency: e.target.value as any})} className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700">
                               <option value="once">Run Once</option>
                               <option value="daily">Daily</option>
                               <option value="weekly">Weekly</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Research Prompt</label>
                           <textarea value={newMission.prompt} onChange={e => setNewMission({...newMission, prompt: e.target.value})} className="w-full p-3 h-32 rounded-xl border dark:bg-gray-900 dark:border-gray-700 resize-none" placeholder="Describe the research task in detail..." />
                       </div>
                       <div className="flex gap-3 pt-4">
                           <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                           <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Create Mission</button>
                       </div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};
