
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
  isPinned?: boolean; // New: Pin feature
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
  isTemporary?: boolean;
}

export type SearchMode = 'concise' | 'copilot' | 'academic' | 'writing' | 'deep-research';

export interface UserProfile {
  displayName: string;
  jobTitle: string;
  bio: string; // Context for the AI
  avatarUrl: string;
}

export interface ModelPreferences {
  temperature: number;
  topP: number;
  customInstructions: Record<string, string>; // Keyed by model ID
}

export interface InterfaceSettings {
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  soundEnabled: boolean;
  codeWrapping: boolean;
  selectedVoice: string; // TTS Voice URI
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  model: string;
  apiKey: string;
  googleApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  systemInstruction: string;
  projectContext: string;
  // New Sections
  profile: UserProfile;
  modelPreferences: ModelPreferences;
  interface: InterfaceSettings;
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

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  members: string[];
  createdAt: number;
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  model?: string;
}

export interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
