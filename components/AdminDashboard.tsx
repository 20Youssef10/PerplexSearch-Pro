
import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Key, Settings, AlertCircle, 
  CheckCircle, BarChart3, Globe, Database, Cpu, ArrowLeft,
  ToggleLeft, ToggleRight, RefreshCcw
} from 'lucide-react';
import { rtdb, remoteConfig } from '../services/firebase';
import { ref, get } from 'firebase/database';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  // Define stats state with explicit types to avoid 'unknown' issues in Object.entries
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

  const [config, setConfig] = useState({
    maintenanceMode: false,
    allowGuestLogin: true,
    maxTokensPerSession: 4096,
    defaultModel: 'sonar'
  });

  useEffect(() => {
    // In a real app, we'd fetch these from Firestore/RTDB
    const fetchStats = async () => {
      if (rtdb) {
        const usersRef = ref(rtdb, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          setStats(prev => ({ ...prev, totalUsers: Object.keys(snapshot.val()).length }));
        }
      }
    };
    fetchStats();
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    const isHealthy = status === 'healthy';
    return (
      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isHealthy ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
      }`}>
        {isHealthy ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
        {status}
      </span>
    );
  };

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
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">Control Center • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
            <RefreshCcw size={16} />
            Sync Cloud
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Research Users', value: stats.totalUsers, icon: <Users size={20} />, color: 'blue' },
              { label: 'Live Conversations', value: '14', icon: <Activity size={20} />, color: 'green' },
              { label: 'API Requests (24h)', value: '1.2k', icon: <BarChart3 size={20} />, color: 'purple' },
              { label: 'Cloud Storage', value: '420MB', icon: <Database size={20} />, color: 'amber' },
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Health */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} className="text-brand-600" />
                    <h2 className="font-bold text-sm">Provider Health & Uptime</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {/* Casting Object.entries to ensure types are correctly inferred as string */}
                  {(Object.entries(stats.apiHealth) as [string, string][]).map(([provider, health]) => (
                    <div key={provider} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-black text-xs uppercase">
                          {provider.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold capitalize">{provider}</p>
                          <p className="text-[10px] text-gray-400">api.{provider}.ai/v1/chat</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-mono">142ms</p>
                          <p className="text-[9px] text-gray-400">Latency</p>
                        </div>
                        <StatusBadge status={health} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remote Config Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                  <Settings size={18} className="text-brand-600" />
                  <h2 className="font-bold text-sm">Remote Application Config</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Maintenance Mode</p>
                        <p className="text-xs text-gray-500">Block all search requests globally</p>
                      </div>
                      <button 
                        onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                        className="text-brand-600"
                      >
                        {config.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Allow Anonymous Research</p>
                        <p className="text-xs text-gray-500">Let guest users run limited queries</p>
                      </div>
                      <button 
                        onClick={() => setConfig({...config, allowGuestLogin: !config.allowGuestLogin})}
                        className="text-brand-600"
                      >
                        {config.allowGuestLogin ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Default Model</label>
                      <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none">
                        <option>sonar</option>
                        <option>sonar-pro</option>
                        <option>gemini-3-flash</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Token Limit</label>
                      <input 
                        type="number" 
                        value={config.maxTokensPerSession}
                        onChange={(e) => setConfig({...config, maxTokensPerSession: parseInt(e.target.value) || 0})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global API Keys Management */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                <Key size={18} className="text-brand-600" />
                <h2 className="font-bold text-sm">Global Master Keys</h2>
              </div>
              <div className="p-5 flex-1 space-y-5">
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl">
                  <p className="text-[11px] text-brand-700 dark:text-brand-300 leading-relaxed font-medium">
                    Keys set here will serve as fallbacks for users without their own API keys.
                  </p>
                </div>
                {['Perplexity', 'Google', 'OpenAI', 'Anthropic'].map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{key} Master Key</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder={`sk-••••••••••••`}
                        className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl p-2.5 pr-10 text-xs outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <Globe size={14} className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-50 dark:border-gray-700">
                <button className="w-full py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
                  Update All Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
