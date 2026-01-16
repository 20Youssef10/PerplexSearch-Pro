
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppSettings, VideoProject } from '../types';
import { Film, Play, Plus, Clock, Download, Loader2, Image as ImageIcon, X, Wand2 } from 'lucide-react';

interface VeoStudioProps {
  settings: AppSettings;
  onClose: () => void;
}

export const VeoStudio: React.FC<VeoStudioProps> = ({ settings, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<any>(null);
  const [mode, setMode] = useState<'text-to-video' | 'image-to-video' | 'extend'>('text-to-video');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!settings.googleApiKey) {
        alert("Google API Key required");
        return;
    }
    
    // Check for API Key selection for Veo (Paid requirement)
    if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
            // Race condition mitigation handled by user interaction loop normally, 
            // but here we just proceed assuming they did it.
        }
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    const ai = new GoogleGenAI({ apiKey: settings.googleApiKey });

    try {
      let operation;
      
      if (mode === 'text-to-video') {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
          });
      } else if (mode === 'image-to-video' && uploadedImage) {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Animate this image",
            image: {
                imageBytes: uploadedImage,
                mimeType: 'image/png' // Assuming PNG/JPEG for simplicity
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
          });
      } else if (mode === 'extend' && lastOperation) {
          // Extension logic
          const prevVideo = lastOperation.response?.generatedVideos?.[0]?.video;
          if (!prevVideo) throw new Error("No previous video to extend");
          
          operation = await ai.models.generateVideos({
              model: 'veo-3.1-generate-preview', // Must be generate-preview for extension? Or fast?
              prompt: prompt || "Continue the video",
              video: prevVideo,
              config: {
                  numberOfVideos: 1,
                  resolution: '720p',
                  aspectRatio: '16:9' // Must match previous
              }
          });
      }

      if (!operation) throw new Error("Invalid parameters");

      // Polling loop
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      setLastOperation(operation);
      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
          setGeneratedVideo(`${uri}&key=${settings.googleApiKey}`);
      }

    } catch (e: any) {
        alert("Generation failed: " + e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setUploadedImage((ev.target?.result as string).split(',')[1]);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-gray-900 text-white flex flex-col animate-in fade-in">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg"><Film size={24} /></div>
                <div>
                    <h1 className="font-bold text-xl">Veo Video Studio</h1>
                    <p className="text-xs text-gray-400">Cinematic AI Video Generation</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24}/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar Controls */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Generation Mode</label>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => setMode('text-to-video')} className={`p-3 rounded-xl text-left text-sm font-bold border transition-all ${mode === 'text-to-video' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-transparent hover:bg-gray-700'}`}>
                            Text to Video
                        </button>
                        <button onClick={() => setMode('image-to-video')} className={`p-3 rounded-xl text-left text-sm font-bold border transition-all ${mode === 'image-to-video' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-transparent hover:bg-gray-700'}`}>
                            Image to Video
                        </button>
                        <button onClick={() => setMode('extend')} disabled={!lastOperation} className={`p-3 rounded-xl text-left text-sm font-bold border transition-all ${mode === 'extend' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-transparent hover:bg-gray-700 disabled:opacity-50'}`}>
                            Extend Video (+7s)
                        </button>
                    </div>
                </div>

                {mode === 'image-to-video' && (
                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Reference Image</label>
                         <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800 transition-colors cursor-pointer relative">
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                             {uploadedImage ? (
                                 <div className="text-green-500 font-bold text-xs">Image Loaded</div>
                             ) : (
                                 <div className="flex flex-col items-center gap-2 text-gray-500">
                                     <ImageIcon size={24} />
                                     <span className="text-xs">Upload Start Frame</span>
                                 </div>
                             )}
                         </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk city with neon rain..."
                        className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none resize-none"
                    />
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || (!prompt && !uploadedImage)}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                </button>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-black flex items-center justify-center p-8 relative">
                {generatedVideo ? (
                    <div className="relative max-w-4xl w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                        <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain" />
                        <a href={generatedVideo} download="veo_generation.mp4" className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white backdrop-blur-md">
                            <Download size={20} />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-gray-600 max-w-md">
                        <Film size={64} className="mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">Ready to Create</h3>
                        <p className="text-sm">Enter a prompt or upload an image to start generating cinematic video with Google Veo.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
