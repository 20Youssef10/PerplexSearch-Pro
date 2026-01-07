export const DEFAULT_MODEL = 'sonar';
export const NEW_CONVERSATION_ID = 'new';

export const PERPLEXITY_MODELS = [
  { 
    id: 'sonar', 
    name: 'Sonar', 
    description: 'Fast, efficient, and cost-effective. Best for quick lookups.' 
  },
  { 
    id: 'sonar-pro', 
    name: 'Sonar Pro', 
    description: 'High intelligence and reasoning. Best for research and complex queries.' 
  },
  { 
    id: 'sonar-reasoning-pro', 
    name: 'Sonar Reasoning Pro', 
    description: 'Specialized in chain-of-thought reasoning. Best for math and logic.' 
  },
  { 
    id: 'r1-1776', 
    name: 'DeepSeek R1', 
    description: 'Powerful open-source model optimized for complex tasks (Llama 70B based).' 
  },
];

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