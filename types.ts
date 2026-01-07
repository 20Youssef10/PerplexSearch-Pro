export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Attachment {
  mimeType: string;
  data: string;
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
  attachments?: Attachment[];
  // For special UI rendering
  type?: 'text' | 'image' | 'video' | 'flashcards' | 'quiz' | 'code';
  metadata?: any; 
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  workspaceId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  folderId?: string;
  workspaceId?: string;
  isTemporary?: boolean; // For temporary chat feature
}

export type SearchMode = 'concise' | 'copilot' | 'academic' | 'writing' | 'deep-research';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  model: string;
  apiKey: string; // Perplexity Key
  googleApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  systemInstruction: string;
  projectContext: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: 'perplexity' | 'google' | 'openai' | 'anthropic';
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

// New Features Types

export interface Workspace {
  id: string;
  name: string;
  icon: string; // Emoji or lucide icon name
  members: string[]; // Email addresses for group chat simulation
  createdAt: number;
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string; // Emoji
  model?: string;
}

export interface CanvasDocument {
  id: string;
  title: string;
  content: string; // Markdown/HTML content
  createdAt: number;
  updatedAt: number;
}
