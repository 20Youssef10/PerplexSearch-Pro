
import { Attachment } from '../types';

export const readFiles = async (files: File[]): Promise<Attachment[]> => {
  const attachments: Attachment[] = [];

  for (const file of files) {
    try {
      // Determine if file is media (base64) or text
      const isMedia = file.type.startsWith('image/') || 
                      file.type.startsWith('audio/') || 
                      file.type.startsWith('video/') || 
                      file.type === 'application/pdf';

      const content = await readFileContent(file, isMedia);
      
      attachments.push({
        name: file.name,
        // If system doesn't detect type (e.g. .ts/.py), default to text/plain for RAG injection to work
        mimeType: file.type || (isMedia ? 'application/octet-stream' : 'text/plain'),
        data: content
      });
    } catch (e) {
      console.warn(`Failed to read file: ${file.name}`, e);
    }
  }

  return attachments;
};

const readFileContent = (file: File, isMedia: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (isMedia) {
       reader.readAsDataURL(file);
       reader.onload = () => {
         const result = reader.result as string;
         // Remove data URL prefix for API compatibility
         const base64 = result.split(',')[1];
         resolve(base64);
       };
    } else {
       reader.readAsText(file);
       reader.onload = () => resolve(reader.result as string);
    }
    
    reader.onerror = () => reject(new Error(`File reading failed: ${reader.error?.message}`));
  });
};
