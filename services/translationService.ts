
import { GoogleGenAI } from "@google/genai";
import { TRANSLATIONS } from "../constants";

export const generateTranslation = async (
  targetLanguage: string,
  apiKey: string
): Promise<Record<string, string>> => {
  const ai = new GoogleGenAI({ apiKey });
  // Fallback to English if strict key check fails, though 'en' is guaranteed to exist
  const baseDictionary = TRANSLATIONS['en'];

  const prompt = `
    You are a professional localization expert.
    Translate the following JSON object's values into "${targetLanguage}".
    Do not translate the keys.
    Return ONLY valid JSON.
    
    Source JSON:
    ${JSON.stringify(baseDictionary, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return json;
  } catch (e: any) {
    console.error("Translation Generation Failed", e);
    throw new Error(`Failed to generate translation: ${e.message}`);
  }
};
