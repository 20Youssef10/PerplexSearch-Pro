
import { GoogleGenAI, GenerateContentResponse, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Message, Attachment, Usage, CustomTool } from '../types';

// Helper to execute user-defined tools
const executeCustomTool = async (tool: CustomTool, args: any): Promise<any> => {
  try {
    const url = new URL(tool.url);
    const method = tool.method || 'GET';
    const headers = tool.headers || {};
    
    // Simple replacement of path params if they exist in args
    let finalUrl = tool.url;
    Object.keys(args).forEach(key => {
        if (finalUrl.includes(`{${key}}`)) {
            finalUrl = finalUrl.replace(`{${key}}`, args[key]);
            delete args[key];
        }
    });

    let body = undefined;
    if (method === 'POST') {
        body = JSON.stringify(args);
        headers['Content-Type'] = 'application/json';
    } else if (method === 'GET') {
        const params = new URLSearchParams(args);
        finalUrl += `?${params.toString()}`;
    }

    const response = await fetch(finalUrl, { method, headers, body });
    const data = await response.json();
    return data;
  } catch (e: any) {
    return { error: e.message };
  }
};

export const generateEmbeddings = async (text: string, apiKey: string): Promise<number[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        content: text
    });
    return result.embedding?.values || [];
};

export const generateAudioOverview = async (sourcesContent: string, apiKey: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Generate an engaging, deep-dive audio overview of the following source material.
    The format should be a dialogue between two hosts (Host A and Host B).
    Host A is the knowledgeable expert, Host B is the curious interviewer.
    They should discuss the key themes, connections, and implications of the text.
    Keep it lively, conversational, and under 3 minutes.
    
    SOURCE MATERIAL:
    ${sourcesContent.substring(0, 30000)} 
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                    { speaker: 'R', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    { speaker: 'S', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
              ]
            }
        }
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("Audio Overview Generation Failed", e);
    throw e;
  }
};

export const streamGeminiCompletion = async (
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (content: string, citations?: string[], usage?: Usage, grounding?: any, audioData?: string) => void,
  signal?: AbortSignal,
  systemPrompt?: string,
  customTools?: CustomTool[]
) => {
  const ai = new GoogleGenAI({ apiKey });

  // 0. AUDIO GENERATION
  if (model.includes('native-audio')) {
    const lastMsg = messages[messages.length - 1];
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: lastMsg.content }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            onChunk("", undefined, undefined, undefined, base64Audio);
        } else {
            onChunk("Error: No audio data returned.");
        }
    } catch (e: any) {
        onChunk(`Audio Generation Error: ${e.message}`);
    }
    return;
  }

  // 1. VEO VIDEO GENERATION (Moved to VeoStudio component mostly, but kept basic support here)
  if (model === 'veo-3.1-fast-generate-preview') {
    const lastMsg = messages[messages.length - 1];
    const prompt = lastMsg.content;
    
    onChunk("Generating video... This may take a minute or two. Please wait.\n\n", undefined, undefined, undefined);

    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        if (signal?.aborted) throw new Error("Aborted");
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        const secureUrl = `${videoUri}&key=${apiKey}`;
        onChunk(`\n![Generated Video](${secureUrl})\n`, undefined, undefined, undefined);
      } else {
        throw new Error("Video generation completed but no URI was returned.");
      }
    } catch (e: any) {
      if (e.message !== "Aborted") {
        onChunk(`\n\n**Error generating video:** ${e.message}`, undefined, undefined, undefined);
      }
    }
    return;
  }

  // 2. IMAGE GENERATION/EDITING
  if (model === 'gemini-2.5-flash-image') {
    const contents = messages.map(m => {
        const mediaAttachments = (m.attachments || []).filter(a => 
            a.mimeType.startsWith('image/') || 
            a.mimeType.startsWith('video/') ||
            a.mimeType === 'application/pdf'
        );

        if (m.role === 'user' && mediaAttachments.length > 0) {
            return {
                role: 'user',
                parts: [
                    ...mediaAttachments.map(att => ({
                        inlineData: { mimeType: att.mimeType, data: att.data }
                    })),
                    { text: m.content }
                ]
            };
        }
        return {
            role: m.role === 'assistant' ? 'model' : m.role,
            parts: [{ text: m.content }]
        };
    });

    onChunk("Generating image...", undefined, undefined, undefined);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
           imageConfig: { aspectRatio: "1:1" }
        }
      });

      let foundImage = false;
      const candidates = response.candidates || [];
      if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
         for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
               const base64 = part.inlineData.data;
               const mime = part.inlineData.mimeType || 'image/png';
               onChunk(`\n![Generated Image](data:${mime};base64,${base64})\n`, undefined, undefined, undefined);
               foundImage = true;
            } else if (part.text) {
               onChunk(part.text, undefined, undefined, undefined);
            }
         }
      }

      if (!foundImage) {
        onChunk("\n(No image generated. Try a more descriptive prompt)", undefined, undefined, undefined);
      }

    } catch(e: any) {
       onChunk(`\n\n**Error generating image:** ${e.message}`, undefined, undefined, undefined);
    }
    return;
  }

  // 3. STANDARD TEXT/MULTIMODAL STREAMING + TOOLS
  let contents = messages.map(m => {
    const mediaAttachments = (m.attachments || []).filter(a => 
        a.mimeType.startsWith('image/') || 
        a.mimeType.startsWith('audio/') || 
        a.mimeType.startsWith('video/') ||
        a.mimeType === 'application/pdf'
    );

    if (m.role === 'user' && mediaAttachments.length > 0) {
      return {
        role: 'user',
        parts: [
          ...mediaAttachments.map(att => ({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          })),
          { text: m.content }
        ]
      };
    }
    return {
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    };
  });

  const config: any = {
    systemInstruction: systemPrompt,
  };

  // Convert CustomTools to FunctionDeclarations
  if (customTools && customTools.length > 0) {
      const toolDecls = customTools.map(t => {
          let properties = {};
          try {
              properties = JSON.parse(t.parameters);
          } catch (e) { console.warn("Invalid params JSON for tool", t.name); }
          
          return {
              name: t.name,
              description: t.description,
              parameters: {
                  type: Type.OBJECT,
                  properties: properties,
                  // Assuming all props are required for simplicity in this generic handler
                  required: Object.keys(properties) 
              }
          } as FunctionDeclaration;
      });
      
      // Merge with existing tools config if any
      config.tools = config.tools || [];
      config.tools.push({ functionDeclarations: toolDecls });
  }

  if (model === 'gemini-3-flash-preview') {
    config.tools = [...(config.tools || []), { googleSearch: {} }];
  } else if (model === 'gemini-3-pro-preview' || model === 'gemini-2.5-pro') {
    config.thinkingConfig = { thinkingBudget: 2048 }; 
  } else if (model === 'gemini-2.5-flash') {
    config.tools = [...(config.tools || []), { googleMaps: {} }];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config
    });

    let citations: string[] = [];

    for await (const chunk of responseStream) {
      if (signal?.aborted) break;

      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) onChunk(text, undefined, undefined, undefined);

      // Handle Function Calls
      const functionCalls = c.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      // In stream, we might get function call parts. 
      // Note: @google/genai stream handling for tools typically requires collecting the full call
      // For simplicity in this demo, we assume single-turn tool use or non-streaming for tools.
      // But if we detect a function call in a chunk (which is rare in stream, usually it's a separate turn),
      // we would execute it. 
      
      // Current SDK limitation: stream + automatic tool execution loop is manual.
      // If we see a function call in the response, we must execute it and send it back.
      // Since we are streaming *to the UI*, we can't easily interrupt the stream to send back to model 
      // without breaking the UI flow. 
      // STRATEGY: We display the "Tool Call" to the user as text, then execute it and append result.
      
      // Getting function calls from stream chunks is complex.
      // We will rely on `response.functionCalls` property if using non-streaming, 
      // but here we check candidates.
      if (c.functionCalls && c.functionCalls.length > 0) {
          for (const fc of c.functionCalls) {
             onChunk(`\n\n> 🛠️ **Executing Tool:** ${fc.name}...\n`);
             const toolDef = customTools?.find(t => t.name === fc.name);
             if (toolDef) {
                 const result = await executeCustomTool(toolDef, fc.args);
                 onChunk(`\n> **Result:** ${JSON.stringify(result).substring(0, 200)}...\n\n`);
                 // In a real agent loop, we would send this back to the model.
                 // Here we just display it.
             }
          }
      }

      const groundingChunk = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunk) {
        const newWebCitations = groundingChunk
          .filter((c: any) => c.web?.uri)
          .map((c: any) => c.web.uri);
        
        const newMapCitations = groundingChunk
          .filter((c: any) => c.maps?.uri)
          .map((c: any) => c.maps.uri);

        if (newWebCitations.length > 0 || newMapCitations.length > 0) {
          citations = [...new Set([...citations, ...newWebCitations, ...newMapCitations])];
          onChunk('', citations, undefined, c.candidates?.[0]?.groundingMetadata);
        }
      }

      if (c.usageMetadata) {
        const usage: Usage = {
          prompt_tokens: c.usageMetadata.promptTokenCount || 0,
          completion_tokens: c.usageMetadata.candidatesTokenCount || 0,
          total_tokens: c.usageMetadata.totalTokenCount || 0
        };
        onChunk('', undefined, usage, undefined);
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) return;
    throw error;
  }
};
