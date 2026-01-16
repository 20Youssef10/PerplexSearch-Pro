
import { GoogleGenAI } from "@google/genai";
import { Attachment } from '../types';

export const extractTextFromMedia = async (
  files: File[],
  apiKey: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  let combinedText = "";

  for (const file of files) {
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
           const result = reader.result as string;
           resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type;
      let prompt = "Extract all text from this document/image verbatim.";
      
      if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
         prompt = "Transcribe the audio/video content verbatim. Identify speakers if possible.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image", // Efficient multimodal model
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      });

      if (response.text) {
        combinedText += `\n\n--- MEDIA EXTRACT: ${file.name} ---\n${response.text}\n--- END EXTRACT ---`;
      }
    } catch (e) {
      console.error(`Failed to extract from ${file.name}`, e);
      combinedText += `\n\n[Error extracting ${file.name}: ${(e as Error).message}]`;
    }
  }

  return combinedText;
};
