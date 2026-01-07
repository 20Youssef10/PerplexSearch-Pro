export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  citations?: string[];
  model?: string;
  responseTime?: number;
  usage?: Usage;
  suggestions?: string[];
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  folderId?: string;
}

export type SearchMode = 'concise' | 'copilot' | 'academic' | 'writing';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  model: string;
  apiKey: string;
  systemInstruction: string;
  projectContext: string;
}

export interface PerplexityResponseChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
  citations?: string[];
  usage?: Usage;
}