import React, { useState } from 'react';
import { Conversation, Folder, Workspace, Gem } from '../types';
import { 
  MessageSquare, Trash2, PlusCircle, Search, Zap, 
  Folder as FolderIcon, FolderPlus, ChevronRight, ChevronDown, 
  Settings as SettingsIcon, ShieldCheck, History, Bookmark,
  Briefcase, User as UserIcon, Gem as GemIcon, Layout, Users, 
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  currentId: string;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  gems: Gem[];
  onSelectWorkspace: (id: string) => void;
  onSelectGem: (gem: Gem) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onCreateFolder: (name: string) => void;
  onMoveToFolder: (convoId: string, folderId?: string) => void;
  onDeleteFolder: (id: string) => void;
  onOpenCanvas: () => void;
  isAdmin?: boolean;
  onGoAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, folders, currentId, workspaces, currentWorkspaceId, gems,
  onSelectWorkspace, onSelectGem, onSelect, onDelete, onNew,
  onCreateFolder, onMoveToFolder, onDeleteFolder, onOpenCanvas, isAdmin, onGoAdmin
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'gems'>('chats');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const renderConversation = (conv: Conversation) => {
    const msgCount = conv.messages.length;
    const isActive = currentId === conv.id;

    return (
      <div 
        key={conv.id}
        className={`group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
          isActive 
            ? 'bg-brand-50 dark:bg-brand-900/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onSelect(conv.id)}
      >
        <MessageSquare size={16} className={`mt-1 flex-shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold truncate ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
            {conv.title}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-0.5">
            {formatDate(conv.createdAt)} • {msgCount} turns
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  const unassignedConvos = conversations.filter(c => !c.folderId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      
      {/* Workspace Selector */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 relative">
        <button 
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg flex items-center justify-center">
             {currentWorkspace.id === 'personal' ? <UserIcon size={16} /> : <Briefcase size={16} />}
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentWorkspace.name}</h2>
            <p className="text-[10px] text-gray-500 font-medium">Free Plan</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showWorkspaceMenu && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            {workspaces.map(w => (
              <button
                key={w.id}
                onClick={() => {
                  onSelectWorkspace(w.id);
                  setShowWorkspaceMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {w.id === 'personal' ? <UserIcon size={16} /> : <Briefcase size={16} />}
                {w.name}
                {w.id === currentWorkspaceId && <div className="ml-auto w-2 h-2 rounded-full bg-brand-500"></div>}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 p-2">
               <button className="w-full flex items-center gap-2 p-2 text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors">
                 <PlusCircle size={14} /> Create Workspace
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'chats' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('gems')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'gems' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Gems
          </button>
        </div>

        {activeTab === 'chats' ? (
          <>
            <button 
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-500/20 font-bold text-sm active:scale-[0.98]"
            >
              <PlusCircle size={16} />
              <span>New Research</span>
            </button>
            <button 
              onClick={onOpenCanvas}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-bold text-sm active:scale-[0.98]"
            >
              <Layout size={16} />
              <span>Open Canvas</span>
            </button>
          </>
        ) : (
          <div className="text-xs text-center text-gray-400 py-1">Select a Gem to start a specialized chat</div>
        )}

        {isAdmin && (
          <button 
            onClick={onGoAdmin}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {activeTab === 'chats' && (
          <>
            <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <span>Folders</span>
              <button onClick={() => setIsCreatingFolder(true)} className="hover:text-brand-500"><FolderPlus size={14} /></button>
            </div>
            
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="px-2 mb-2">
                <input 
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder..."
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                  className="w-full bg-gray-100 dark:bg-gray-800 border-none text-sm p-3 rounded-xl outline-none ring-1 ring-brand-500 font-medium"
                />
              </form>
            )}

            {folders.map(folder => {
              const folderConvos = conversations.filter(c => c.folderId === folder.id);
              const isExpanded = expandedFolders[folder.id];

              return (
                <div key={folder.id} className="space-y-0.5">
                  <div 
                    className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                    <FolderIcon size={16} className={`${folderConvos.length > 0 ? 'text-amber-500' : 'text-gray-300'}`} />
                    <span className="flex-1 text-sm font-bold text-gray-600 dark:text-gray-400 truncate">{folder.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ml-5 pl-2 border-l border-gray-100 dark:border-gray-800 space-y-0.5 py-1">
                      {folderConvos.map(renderConversation)}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-2 px-3 py-2 mt-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <span>Recent Activity</span>
            </div>
            {unassignedConvos.map(renderConversation)}
          </>
        )}

        {activeTab === 'gems' && (
          <div className="space-y-2 p-1">
            {gems.map(gem => (
              <button
                key={gem.id}
                onClick={() => onSelectGem(gem)}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="text-xl bg-white dark:bg-gray-700 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                  {gem.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{gem.name}</h3>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{gem.description}</p>
                </div>
              </button>
            ))}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
              <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tools</p>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
                <GraduationCap size={16} className="text-blue-500" />
                Quiz Maker
              </button>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Layout size={16} className="text-green-500" />
                Flashcards
              </button>
            </div>
          </div>
        )}
      </div>
      
      {currentWorkspace.id === 'work' && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Users size={14} />
            Invite Member
          </button>
        </div>
      )}
    </div>
  );
};
