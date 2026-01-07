
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 or Text content
}

export interface Slide {
  title: string;
  content: string[];
  note?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: any[];
  xKey: string;
  yKeys: string[];
}

export interface YouTubeVideo {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface ArenaComparison {
  modelA: { name: string; content: string; time: number };
  modelB: { name: string; content: string; time: number };
  winner?: 'modelA' | 'modelB' | 'tie';
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'arena'; // Added arena
  content: string;
  timestamp: number;
  citations?: string[];
  model?: string;
  responseTime?: number;
  usage?: Usage;
  suggestions?: string[];
  attachments?: Attachment[];
  isPinned?: boolean;
  // For special UI rendering
  type?: 'text' | 'image' | 'video' | 'flashcards' | 'quiz' | 'code' | 'audio' | 'slides' | 'youtube' | 'chart' | 'mermaid';
  metadata?: any; 
  audioData?: string; // Base64 audio
  slidesData?: Slide[];
  youtubeData?: YouTubeVideo[];
  chartData?: ChartData; // For Analyst Mode
  arenaComparison?: ArenaComparison; // For Arena Mode
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
  tags?: string[]; // Knowledge Graph tags
}

export type SearchMode = 'concise' | 'copilot' | 'academic' | 'writing' | 'deep-research' | 'youtube' | 'presentation' | 'analyst' | 'arena';

export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface UserProfile {
  displayName: string;
  jobTitle: string;
  bio: string;
  avatarUrl: string;
}

export interface ModelPreferences {
  temperature: number;
  topP: number;
  customInstructions: Record<string, string>;
}

export interface InterfaceSettings {
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  soundEnabled: boolean;
  codeWrapping: boolean;
  selectedVoice: string;
  language: AppLanguage;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  model: string;
  apiKey: string;
  googleApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string; // New: Local LLM
  systemInstruction: string;
  projectContext: string;
  memories: string[];
  profile: UserProfile;
  modelPreferences: ModelPreferences;
  interface: InterfaceSettings;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: 'perplexity' | 'google' | 'openai' | 'anthropic' | 'ollama';
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
