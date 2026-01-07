import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Attachment, Usage } from '../types';

export const streamGeminiCompletion = async (
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (content: string, citations?: string[], usage?: Usage, grounding?: any) => void,
  signal?: AbortSignal,
  systemPrompt?: string
) => {
  const ai = new GoogleGenAI({ apiKey });

  // 1. VEO VIDEO GENERATION
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

      // Poll for completion
      while (!operation.done) {
        if (signal?.aborted) throw new Error("Aborted");
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        // Veo URIs require the API Key appended
        const secureUrl = `${videoUri}&key=${apiKey}`;
        // Output as Markdown Image with special alt text so MessageList can render it as a video
        onChunk(`\n![Generated Video](${secureUrl})\n`, undefined, undefined, undefined);
      } else {
        throw new Error("Video generation completed but no URI was returned.");
      }
    } catch (e: any) {
      if (e.message !== "Aborted") {
        console.error("Veo Error:", e);
        onChunk(`\n\n**Error generating video:** ${e.message}`, undefined, undefined, undefined);
      }
    }
    return;
  }

  // 2. IMAGE GENERATION/EDITING
  if (model === 'gemini-2.5-flash-image') {
    const contents = messages.map(m => {
        if (m.role === 'user' && m.attachments && m.attachments.length > 0) {
            return {
                role: 'user',
                parts: [
                    ...m.attachments.map(att => ({
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
       console.error("Image Gen Error:", e);
       onChunk(`\n\n**Error generating image:** ${e.message}`, undefined, undefined, undefined);
    }
    return;
  }

  // 3. STANDARD TEXT/MULTIMODAL STREAMING
  let contents = messages.map(m => {
    if (m.role === 'user' && m.attachments && m.attachments.length > 0) {
      return {
        role: 'user',
        parts: [
          ...m.attachments.map(att => ({
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

  if (model === 'gemini-3-flash-preview') {
    config.tools = [{ googleSearch: {} }];
  } else if (model === 'gemini-3-pro-preview') {
    config.thinkingConfig = { thinkingBudget: 2048 }; 
  } else if (model === 'gemini-2.5-flash') {
    config.tools = [{ googleMaps: {} }];
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