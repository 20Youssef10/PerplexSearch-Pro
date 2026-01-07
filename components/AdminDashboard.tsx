
import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Key, Settings, AlertCircle, 
  CheckCircle, BarChart3, Globe, Database, Cpu, ArrowLeft,
  ToggleLeft, ToggleRight, RefreshCcw, Search, Trash2, Ban,
  MessageSquare, Save, X
} from 'lucide-react';
import { rtdb } from '../services/firebase';
import { ref, get, update, set, remove } from 'firebase/database';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'keys' | 'system'>('overview');
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeSessions: number;
    apiHealth: Record<string, string>;
  }>({
    totalUsers: 0,
    activeSessions: 0,
    apiHealth: {
      perplexity: 'healthy',
      google: 'healthy',
      openai: 'healthy',
      anthropic: 'degraded'
    }
  });

  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  
  // Key Management State
  const [globalKeys, setGlobalKeys] = useState({
    perplexity: '',
    google: '',
    openai: '',
    anthropic: ''
  });
  const [isUpdatingKeys, setIsUpdatingKeys] = useState(false);

  // Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning'>('info');

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchStats = async () => {
    if (rtdb) {
      const usersRef = ref(rtdb, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        setStats(prev => ({ ...prev, totalUsers: Object.keys(snapshot.val()).length }));
      }
    }
  };

  const fetchUsers = async () => {
    if (rtdb) {
      const usersRef = ref(rtdb, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userArray = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setUsers(userArray);
      }
    }
  };

  const handleUpdateKeys = async () => {
    if (!rtdb) return;
    if (!globalKeys.perplexity && !globalKeys.google && !globalKeys.openai && !globalKeys.anthropic) {
       if (!confirm("No keys entered. This won't update anything. Continue?")) return;
    }

    setIsUpdatingKeys(true);
    try {
      const usersRef = ref(rtdb, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const updates: any = {};
        const allUsers = snapshot.val();
        
        Object.keys(allUsers).forEach(userId => {
           if (globalKeys.perplexity) updates[`users/${userId}/settings/apiKey`] = globalKeys.perplexity;
           if (globalKeys.google) updates[`users/${userId}/settings/googleApiKey`] = globalKeys.google;
           if (globalKeys.openai) updates[`users/${userId}/settings/openaiApiKey`] = globalKeys.openai;
           if (globalKeys.anthropic) updates[`users/${userId}/settings/anthropicApiKey`] = globalKeys.anthropic;
        });

        if (Object.keys(updates).length > 0) {
            await update(ref(rtdb), updates);
            alert(`Successfully pushed keys to ${Object.keys(allUsers).length} users.`);
        } else {
            alert("No users found to update.");
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(`Failed to update keys: ${e.message}`);
    } finally {
      setIsUpdatingKeys(false);
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    if (!rtdb) return;
    try {
        await update(ref(rtdb, `users/${userId}`), { banned: !currentStatus });
        setUsers(users.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
    } catch (e) {
        alert("Failed to update ban status");
    }
  };

  const deleteUser = async (userId: string) => {
      if (!confirm("Are you sure you want to delete this user's data? This cannot be undone.")) return;
      if (!rtdb) return;
      try {
          await remove(ref(rtdb, `users/${userId}`));
          setUsers(users.filter(u => u.id !== userId));
      } catch (e) {
          alert("Failed to delete user");
      }
  };

  const sendBroadcast = async () => {
      if (!rtdb) return;
      try {
          if (!broadcastMsg.trim()) {
              await remove(ref(rtdb, 'system/broadcast'));
              alert("Broadcast cleared");
          } else {
              await set(ref(rtdb, 'system/broadcast'), {
                  message: broadcastMsg,
                  type: broadcastType,
                  timestamp: Date.now()
              });
              alert("Broadcast sent to all active sessions");
          }
      } catch (e) {
          alert("Failed to set broadcast");
      }
  };

  const filteredUsers = users.filter(u => 
    u.settings?.profile?.displayName?.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.id.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col animate-in fade-in duration-300">
      <header className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="text-brand-600" size={20} />
                <h1 className="text-xl font-black tracking-tight">System Admin</h1>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">Control Center</p>
            </div>
          </div>
          <div className="flex gap-2">
             {['overview', 'users', 'keys', 'system'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                 >
                    {tab}
                 </button>
             ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} />, color: 'blue' },
                  { label: 'Active Sessions', value: '14', icon: <Activity size={20} />, color: 'green' },
                  { label: 'API Requests', value: '1.2k', icon: <BarChart3 size={20} />, color: 'purple' },
                  { label: 'Storage', value: '420MB', icon: <Database size={20} />, color: 'amber' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-${stat.color}-600 bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-black">{stat.value}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-sm">User Management</h3>
                      <div className="relative">
                          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                          <input 
                             value={searchUser}
                             onChange={(e) => setSearchUser(e.target.value)}
                             placeholder="Search users..."
                             className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm outline-none border border-transparent focus:border-brand-500"
                          />
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs font-bold">
                              <tr>
                                  <th className="p-4">User</th>
                                  <th className="p-4">ID</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {filteredUsers.map(u => (
                                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                      <td className="p-4">
                                          <div className="font-bold">{u.settings?.profile?.displayName || 'Unknown'}</div>
                                          <div className="text-xs text-gray-400">{u.settings?.profile?.jobTitle || 'No Role'}</div>
                                      </td>
                                      <td className="p-4 font-mono text-xs text-gray-400">{u.id}</td>
                                      <td className="p-4">
                                          {u.banned ? (
                                              <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-[10px] font-bold uppercase">Banned</span>
                                          ) : (
                                              <span className="px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-bold uppercase">Active</span>
                                          )}
                                      </td>
                                      <td className="p-4 text-right flex justify-end gap-2">
                                          <button 
                                            onClick={() => toggleBan(u.id, u.banned)}
                                            className={`p-2 rounded-lg transition-colors ${u.banned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                            title={u.banned ? "Unban" : "Ban User"}
                                          >
                                              {u.banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                          </button>
                                          <button 
                                            onClick={() => deleteUser(u.id)}
                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                            title="Delete Data"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* KEYS TAB */}
          {activeTab === 'keys' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                <Key size={18} className="text-brand-600" />
                <h2 className="font-bold text-sm">Global Master Keys Injection</h2>
              </div>
              <div className="p-5 flex-1 space-y-5">
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl">
                  <p className="text-[11px] text-brand-700 dark:text-brand-300 leading-relaxed font-medium">
                    Keys entered here will be forcibly pushed to <strong>ALL</strong> existing users, overwriting their current settings if set. Use with caution.
                  </p>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Perplexity Master Key</label>
                        <input 
                           type="password" 
                           value={globalKeys.perplexity}
                           onChange={(e) => setGlobalKeys({...globalKeys, perplexity: e.target.value})}
                           className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                           placeholder="pplx-..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Google Gemini Master Key</label>
                        <input 
                           type="password" 
                           value={globalKeys.google}
                           onChange={(e) => setGlobalKeys({...globalKeys, google: e.target.value})}
                           className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                           placeholder="AIza..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">OpenAI Master Key</label>
                        <input 
                           type="password" 
                           value={globalKeys.openai}
                           onChange={(e) => setGlobalKeys({...globalKeys, openai: e.target.value})}
                           className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                           placeholder="sk-..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Anthropic Master Key</label>
                        <input 
                           type="password" 
                           value={globalKeys.anthropic}
                           onChange={(e) => setGlobalKeys({...globalKeys, anthropic: e.target.value})}
                           className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                           placeholder="sk-ant-..."
                        />
                    </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-50 dark:border-gray-700">
                <button 
                   onClick={handleUpdateKeys}
                   disabled={isUpdatingKeys}
                   className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                >
                  {isUpdatingKeys ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                  {isUpdatingKeys ? 'Updating Users...' : 'Push Keys to All Users'}
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM BROADCAST TAB */}
          {activeTab === 'system' && (
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                    <MessageSquare size={18} className="text-brand-600" />
                    <h2 className="font-bold text-sm">Global Broadcast System</h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">Send a message to all connected clients instantly. Leave empty to clear the broadcast.</p>
                    <textarea 
                       value={broadcastMsg}
                       onChange={(e) => setBroadcastMsg(e.target.value)}
                       className="w-full h-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                       placeholder="Enter system announcement..."
                    />
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="type" checked={broadcastType === 'info'} onChange={() => setBroadcastType('info')} />
                            <span className="text-sm font-bold">Info</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="type" checked={broadcastType === 'warning'} onChange={() => setBroadcastType('warning')} />
                            <span className="text-sm font-bold text-amber-600">Warning</span>
                        </label>
                    </div>
                    <button 
                       onClick={sendBroadcast}
                       className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
                    >
                        Update Broadcast
                    </button>
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};
