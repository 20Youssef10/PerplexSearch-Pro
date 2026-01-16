
import React, { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Conversation, Folder } from '../types';
import { X, Network } from 'lucide-react';

interface KnowledgeGraphProps {
  conversations: Conversation[];
  folders: Folder[];
  onSelectNode: (id: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ conversations, folders, onSelectNode, onClose, isDark }) => {
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    // Add Folders
    folders.forEach(f => {
      nodes.push({ id: f.id, name: f.name, group: 'folder', val: 20 });
    });

    // Add Conversations
    conversations.forEach(c => {
      nodes.push({ id: c.id, name: c.title, group: 'conversation', val: 10 });
      
      // Link to Folder
      if (c.folderId) {
        links.push({ source: c.folderId, target: c.id });
      }

      // Semantic Linking (Simple approximation: matching words in title)
      const words = c.title.toLowerCase().split(' ').filter(w => w.length > 4);
      conversations.forEach(other => {
         if (other.id !== c.id) {
             const otherWords = other.title.toLowerCase().split(' ').filter(w => w.length > 4);
             const common = words.filter(w => otherWords.includes(w));
             if (common.length > 0) {
                 // Avoid duplicate links
                 const existingLink = links.find(l => (l.source === c.id && l.target === other.id) || (l.source === other.id && l.target === c.id));
                 if (!existingLink) {
                     links.push({ source: c.id, target: other.id, value: common.length });
                 }
             }
         }
      });
    });

    return { nodes, links };
  }, [conversations, folders]);

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-in zoom-in-95 duration-300 flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
         <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-lg">
            <Network size={20} />
         </div>
         <div>
             <h2 className="font-bold text-sm text-gray-800 dark:text-gray-100">Knowledge Graph</h2>
             <p className="text-xs text-gray-500">{graphData.nodes.length} Nodes • {graphData.links.length} Connections</p>
         </div>
      </div>
      
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full backdrop-blur-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
         <X size={20} className="text-gray-500" />
      </button>

      <div className="flex-1 cursor-move">
         <ForceGraph3D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={node => {
                if ((node as any).group === 'folder') return isDark ? '#f59e0b' : '#d97706';
                return isDark ? '#0d9488' : '#0891b2';
            }}
            linkColor={() => isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
            backgroundColor={isDark ? '#111827' : '#ffffff'}
            nodeRelSize={6}
            onNodeClick={node => onSelectNode(node.id as string)}
            linkWidth={link => (link as any).value || 1}
            linkOpacity={0.5}
         />
      </div>
    </div>
  );
};
