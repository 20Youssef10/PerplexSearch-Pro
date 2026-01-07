import React, { useState } from 'react';
import { Conversation, Folder } from '../types';
import { MessageSquare, Trash2, PlusCircle, Search, Download, Zap, Folder as FolderIcon, FolderPlus, ChevronRight, ChevronDown, MoreVertical, FolderInput } from 'lucide-react';
import { NEW_CONVERSATION_ID } from '../constants';

interface SidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  currentId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onCreateFolder: (name: string) => void;
  onMoveToFolder: (convoId: string, folderId?: string) => void;
  onDeleteFolder: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, folders, currentId, onSelect, onDelete, onNew,
  onCreateFolder, onMoveToFolder, onDeleteFolder 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleExport = (conv: Conversation) => {
    const text = conv.messages.map(m => `**${m.role.toUpperCase()}**: ${m.content}${m.citations ? '\n\nSources: ' + m.citations.join(', ') : ''}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    const totalTokens = conv.messages.reduce((acc, m) => acc + (m.usage?.total_tokens || 0), 0);
    const isActive = currentId === conv.id;

    return (
      <div 
        key={conv.id}
        className={`group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
          isActive 
            ? 'bg-brand-50 dark:bg-brand-900/20' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onSelect(conv.id)}
      >
        <MessageSquare size={16} className={`mt-1 flex-shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
            {conv.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
              {formatDate(conv.createdAt)} • {msgCount} msgs
            </p>
          </div>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
             className="p-1 hover:text-red-500 transition-colors"
           >
             <Trash2 size={14} />
           </button>
        </div>
      </div>
    );
  };

  const unassignedConvos = conversations.filter(c => !c.folderId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 space-y-3">
        <button 
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm font-medium"
        >
          <PlusCircle size={18} />
          <span>New Research</span>
        </button>
        
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Library</span>
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="p-1 text-gray-400 hover:text-brand-500 transition-colors"
            title="Create Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="px-2 mb-2">
            <input 
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              onBlur={() => !newFolderName && setIsCreatingFolder(false)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none text-sm p-2 rounded-lg outline-none ring-1 ring-brand-500"
            />
          </form>
        )}

        {/* Folders */}
        {folders.map(folder => {
          const folderConvos = conversations.filter(c => c.folderId === folder.id);
          const isExpanded = expandedFolders[folder.id];

          return (
            <div key={folder.id} className="space-y-0.5">
              <div 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                onClick={() => toggleFolder(folder.id)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderIcon size={16} className="text-amber-500" />
                <span className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{folder.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-gray-100 dark:border-gray-800 space-y-0.5">
                  {folderConvos.length === 0 ? (
                    <div className="p-2 text-[11px] text-gray-400 italic">Empty folder</div>
                  ) : (
                    folderConvos.map(renderConversation)
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Conversations */}
        <div className="pt-2">
          {unassignedConvos.map(renderConversation)}
        </div>

        {conversations.length === 0 && !isCreatingFolder && (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-10 text-sm">
            <Search size={32} className="mx-auto mb-2 opacity-30" />
            <p>Ready to explore</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
        <span>v1.2 Pro Edition</span>
        <Zap size={10} className="text-brand-500" />
      </div>
    </div>
  );
};