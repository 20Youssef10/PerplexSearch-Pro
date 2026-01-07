import { ModelConfig } from './types';

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
    description: 'Google: Fast, low latency',
    provider: 'google'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Google: Complex reasoning',
    provider: 'google'
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI: Most advanced model',
    provider: 'openai'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI: Efficient & fast',
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
  copilot: "You are a helpful co-pilot. Break down complex problems into steps and ask clarifying questions if necessary."
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
  }
];