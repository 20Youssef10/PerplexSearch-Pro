import { ModelConfig, Gem } from './types';

export const DEFAULT_MODEL = 'sonar';
export const NEW_CONVERSATION_ID = 'new';

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Perplexity
  { 
    id: 'sonar', 
    name: 'Sonar', 
    description: 'Perplexity: Fast online search',
    provider: 'perplexity'
  },
  { 
    id: 'sonar-pro', 
    name: 'Sonar Pro', 
    description: 'Perplexity: Deep research & reasoning',
    provider: 'perplexity'
  },
  { 
    id: 'sonar-reasoning', 
    name: 'Sonar Reasoning', 
    description: 'Perplexity: Chain of thought',
    provider: 'perplexity'
  },
  // Google
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Google: Next-gen fast model',
    provider: 'google'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Google: Next-gen reasoning',
    provider: 'google'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google: Versatile & Efficient (Maps)',
    provider: 'google'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google: High intelligence & Thinking',
    provider: 'google'
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Nano Banana',
    description: 'Google: Image Generation & Editing',
    provider: 'google'
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI: Most advanced standard model',
    provider: 'openai'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI: Efficient & fast',
    provider: 'openai'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'OpenAI: High-context legacy',
    provider: 'openai'
  },
  {
    id: 'o1-preview',
    name: 'o1 Preview',
    description: 'OpenAI: Deep reasoning (Slow)',
    provider: 'openai'
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    description: 'OpenAI: Fast reasoning',
    provider: 'openai'
  },
  // Anthropic
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic: Best for coding & nuance',
    provider: 'anthropic'
  }
];

// For backward compatibility if needed, though we should migrate usage
export const PERPLEXITY_MODELS = AVAILABLE_MODELS.filter(m => m.provider === 'perplexity');

export const MODE_PROMPTS: Record<string, string> = {
  concise: "Be precise, concise, and direct in your answers.",
  academic: "You are an academic researcher. Provide detailed, technical answers with heavy reliance on citations. Use formal language.",
  writing: "You are a creative writing assistant. Focus on flow, style, and engaging narrative. You can be more verbose.",
  copilot: "You are a helpful co-pilot. Break down complex problems into steps and ask clarifying questions if necessary.",
  "deep-research": "You are a Deep Research Agent. Your goal is to exhaustively research the user's query. Break the problem down into multiple sub-questions, explore each thoroughly, and synthesize a comprehensive report. Use 'thinking' blocks to show your plan."
};

// This instruction forces the model to provide follow-up questions in a specific parseable format
export const FOLLOW_UP_INSTRUCTION = `
At the VERY END of your response, provide exactly 3 suggested follow-up questions that the user might want to ask next. 
Format them exactly like this:
---
[[SUGGESTIONS]]
1. [Question 1]
2. [Question 2]
3. [Question 3]
`;

export const API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';

export const PROMPT_TEMPLATES = [
  {
    category: 'Analysis',
    prompts: [
      { title: 'SWOT Analysis', text: 'Conduct a detailed SWOT analysis for [Company/Product].' },
      { title: 'Root Cause', text: 'Analyze the root cause of [Problem] using the 5 Whys method.' },
      { title: 'Market Research', text: 'Provide a comprehensive market analysis for [Industry/Topic], including key trends and competitors.' },
    ]
  },
  {
    category: 'Coding',
    prompts: [
      { title: 'Code Review', text: 'Review this code for best practices, security vulnerabilities, and performance optimizations:\n\n' },
      { title: 'Explain Code', text: 'Explain how this code works step-by-step to a junior developer:\n\n' },
      { title: 'Unit Tests', text: 'Generate comprehensive unit tests for the following function, covering edge cases:\n\n' },
    ]
  },
  {
    category: 'Writing',
    prompts: [
      { title: 'Blog Post', text: 'Write an engaging technical blog post about [Topic] targeting [Audience].' },
      { title: 'Email Polish', text: 'Rewrite this email to be more professional and concise:\n\n' },
      { title: 'Executive Summary', text: 'Summarize the following text into a one-paragraph executive summary:\n\n' },
    ]
  },
  {
    category: 'Tools',
    prompts: [
      { title: 'Generate Quiz', text: 'Create a 5-question multiple choice quiz about [Topic] in JSON format.' },
      { title: 'Flashcards', text: 'Generate 10 study flashcards for [Topic] with terms and definitions.' },
      { title: 'Presentation Outline', text: 'Create a slide-by-slide outline for a 10-minute presentation on [Topic].' }
    ]
  }
];

export const DEFAULT_GEMS: Gem[] = [
  {
    id: 'coding-wizard',
    name: 'Code Wizard',
    description: 'Expert Full-Stack Developer',
    icon: '💻',
    systemPrompt: 'You are an expert Senior Software Engineer. You write clean, efficient, and well-documented code. You prefer TypeScript and Python.'
  },
  {
    id: 'creative-muse',
    name: 'Creative Muse',
    description: 'Storytelling & Ideation',
    icon: '🎨',
    systemPrompt: 'You are a creative writing partner. Focus on vivid imagery, compelling narratives, and unique angles. Avoid clichés.'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Insights from raw data',
    icon: '📊',
    systemPrompt: 'You are a Data Analyst. You excel at finding patterns, explaining statistical concepts, and structuring data. Be objective and precise.'
  },
  {
    id: 'teacher',
    name: 'Tutor',
    description: 'Explain like I\'m 5',
    icon: '🎓',
    systemPrompt: 'You are a patient and encouraging tutor. Explain complex concepts simply, using analogies and examples. Check for understanding.'
  }
];

export const DEFAULT_WORKSPACES = [
  { id: 'personal', name: 'Personal', icon: 'User', members: [], createdAt: Date.now() },
  { id: 'work', name: 'Work', icon: 'Briefcase', members: [], createdAt: Date.now() }
];
