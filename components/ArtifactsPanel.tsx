
import React, { useEffect, useRef, useState } from 'react';
import { Artifact } from '../types';
import { X, Play, Copy, Maximize2, RefreshCw, Code, Image as ImageIcon, BarChart3, Download } from 'lucide-react';
import mermaid from 'mermaid';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface ArtifactsPanelProps {
  artifact: Artifact;
  onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (artifact.type === 'mermaid' && mermaidRef.current) {
       mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
       mermaid.run({ nodes: [mermaidRef.current] }).catch(console.error);
    }
  }, [artifact]);

  const copyToClipboard = () => {
    const content = typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content, null, 2);
    navigator.clipboard.writeText(content);
  };

  const renderContent = () => {
    if (artifact.type === 'mermaid') {
      return (
        <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 p-4 overflow-auto">
          <div ref={mermaidRef} className="mermaid">{artifact.content}</div>
        </div>
      );
    }

    if (artifact.type === 'chart') {
      const chart = artifact.content;
      return (
         <div className="p-6 h-full bg-white dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-6 text-center">{chart.title}</h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'line' ? (
                  <LineChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k: string, i: number)=><Line key={k} type="monotone" dataKey={k} stroke={COLORS[i%COLORS.length]}/>)}</LineChart>
                ) : chart.type === 'bar' ? (
                  <BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k: string, i: number)=><Bar key={k} dataKey={k} fill={COLORS[i%COLORS.length]}/>)}</BarChart>
                ) : chart.type === 'area' ? (
                  <AreaChart data={chart.data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={chart.xKey}/><YAxis/><Tooltip/><Legend/>{chart.yKeys.map((k: string, i: number)=><Area key={k} type="monotone" dataKey={k} fill={COLORS[i%COLORS.length]} stroke={COLORS[i%COLORS.length]}/>)}</AreaChart>
                ) : (
                  <PieChart><Pie data={chart.data} dataKey={chart.yKeys[0]} nameKey={chart.xKey} cx="50%" cy="50%" outerRadius={120} label>{chart.data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
                )}
              </ResponsiveContainer>
            </div>
         </div>
      );
    }

    // Code & HTML
    if (activeTab === 'code') {
      return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 overflow-auto font-mono text-sm">
          <pre className="whitespace-pre-wrap break-all">{artifact.content}</pre>
        </div>
      );
    }

    // HTML/JS Preview
    const srcDoc = artifact.language === 'html' ? artifact.content : `
      <html>
        <head><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-white text-black p-4">
          <script>
            try {
              ${artifact.content}
            } catch (err) {
              document.body.innerHTML = '<div class="text-red-500 font-bold">Runtime Error: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;

    return (
      <iframe 
        srcDoc={srcDoc} 
        className="w-full h-full bg-white" 
        sandbox="allow-scripts allow-modals" 
        title="preview"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-lg">
              {artifact.type === 'code' ? <Code size={16}/> : artifact.type === 'chart' ? <BarChart3 size={16}/> : <ImageIcon size={16}/>}
           </div>
           <span className="font-bold text-sm truncate max-w-[150px]">{artifact.title || 'Artifact'}</span>
        </div>
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mx-2">
           <button 
             onClick={() => setActiveTab('preview')} 
             className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600' : 'text-gray-500'}`}
             disabled={artifact.type === 'chart' || artifact.type === 'mermaid'}
           >
             Preview
           </button>
           <button 
             onClick={() => setActiveTab('code')} 
             className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600' : 'text-gray-500'}`}
           >
             Code
           </button>
        </div>

        <div className="flex items-center gap-1">
           <button onClick={copyToClipboard} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Copy Code">
             <Copy size={16} />
           </button>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
             <X size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};
