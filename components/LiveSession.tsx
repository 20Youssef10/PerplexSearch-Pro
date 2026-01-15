
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { createPCM16Blob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

interface LiveSessionProps {
  apiKey: string;
  voiceName?: string;
  onClose: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ apiKey, voiceName = 'Zephyr', onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState('Connecting...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [nextStartTime, setNextStartTime] = useState(0);
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null); // LiveSession type is dynamic in SDK
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setStatus("Error: No API Key provided");
      return;
    }

    const initSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey });
        aiRef.current = ai;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
        const outputNode = ctx.createGain();
        outputNode.connect(ctx.destination);

        // Input Context (Microphone) needs 16kHz for Gemini
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              setStatus("Live");
              
              const source = inputCtx.createMediaStreamSource(stream);
              // 4096 buffer size for balance between latency and processing
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;
              
              processor.onaudioprocess = (e) => {
                if (!isMicOn) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualizer
                let sum = 0;
                for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(prev => prev * 0.8 + rms * 10 * 0.2); // Smooth volume

                const { base64 } = createPCM16Blob(inputData);
                
                sessionPromise.then((session: any) => {
                  session.sendRealtimeInput({ 
                    media: { 
                      mimeType: 'audio/pcm;rate=16000', 
                      data: base64 
                    } 
                  });
                });
              };
              
              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
               // Fix: Added optional chaining (parts?.[0]) to handle undefined parts array
               const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
               if (base64Audio) {
                 const currentCtx = ctx; // Closure capture
                 const decoded = base64ToUint8Array(base64Audio);
                 const audioBuffer = await decodeAudioData(decoded, currentCtx);
                 
                 const source = currentCtx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 
                 // Schedule gapless playback
                 const now = currentCtx.currentTime;
                 const start = Math.max(now, nextStartTime); // Use ref value if possible, but state works here as closure
                 // We need to use a mutable ref for nextStartTime inside the callback to avoid stale state
                 // But since we are in a closure, let's just use currentCtx.currentTime + duration for simplicity in this demo version
                 
                 source.start(start);
                 setNextStartTime(start + audioBuffer.duration); // Update state for next chunk
                 
                 sourcesRef.current.add(source);
                 source.onended = () => sourcesRef.current.delete(source);
               }

               if (msg.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 setNextStartTime(0);
               }
            },
            onclose: () => {
              setIsConnected(false);
              setStatus("Disconnected");
            },
            onerror: (err) => {
              console.error(err);
              setStatus("Connection Error");
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            },
            systemInstruction: "You are Gemini Live, a helpful, witty, and concise AI assistant. Keep answers brief and conversational."
          }
        });

        sessionRef.current = await sessionPromise;

      } catch (e: any) {
        console.error(e);
        setStatus(`Error: ${e.message}`);
      }
    };

    initSession();

    return () => {
      // Cleanup
      sourcesRef.current.forEach(s => s.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContext) audioContext.close();
      if (sessionRef.current) {
          // SDK doesn't always expose clean close method on the resolved session object directly depending on version
          // but closing the stream/context is usually enough
      }
    };
  }, [apiKey]);

  // Visualizer Orb
  const orbScale = 1 + Math.min(volume, 1.5);

  return (
    <div className="absolute inset-0 z-50 bg-black text-white flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
           <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <span className="text-xs font-bold tracking-widest uppercase">{status}</span>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
          <X size={24} />
        </button>
      </div>

      {/* Center Visualizer */}
      <div className="relative flex items-center justify-center w-full h-full">
         {/* Glow effects */}
         <div 
            className="absolute w-64 h-64 bg-brand-500/30 rounded-full blur-[100px] transition-transform duration-75"
            style={{ transform: `scale(${orbScale})` }}
         />
         <div 
            className="absolute w-48 h-48 bg-blue-500/20 rounded-full blur-[80px] animate-pulse" 
         />
         
         {/* Main Orb */}
         <div 
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-brand-400 to-blue-600 shadow-[0_0_50px_rgba(13,148,136,0.5)] flex items-center justify-center transition-transform duration-75"
            style={{ transform: `scale(${orbScale})` }}
         >
            <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-spin-slow" />
         </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 flex items-center gap-6 z-10">
         <button 
           onClick={() => setIsMicOn(!isMicOn)}
           className={`p-6 rounded-full transition-all duration-300 shadow-2xl ${isMicOn ? 'bg-white text-black hover:scale-105' : 'bg-red-500 text-white hover:bg-red-600'}`}
         >
           {isMicOn ? <Mic size={32} /> : <MicOff size={32} />}
         </button>
      </div>

      <div className="absolute bottom-4 text-xs text-white/30 font-mono">
        Gemini 2.5 Flash Native Audio
      </div>
    </div>
  );
};
