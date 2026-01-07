
import { Attachment } from '../types';

export const readFiles = async (files: File[]): Promise<Attachment[]> => {
  const attachments: Attachment[] = [];

  for (const file of files) {
    const content = await readFileContent(file);
    attachments.push({
      name: file.name,
      mimeType: file.type,
      data: content
    });
  }

  return attachments;
};

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
       // Read images as base64 for Gemini
       reader.readAsDataURL(file);
       reader.onload = () => {
         const result = reader.result as string;
         // Remove data URL prefix for Gemini if needed, but here we keep full for UI
         const base64 = result.split(',')[1];
         resolve(base64);
       };
    } else {
       // Read text/csv/json/code as Text
       reader.readAsText(file);
       reader.onload = () => resolve(reader.result as string);
    }
    
    reader.onerror = reject;
  });
};
