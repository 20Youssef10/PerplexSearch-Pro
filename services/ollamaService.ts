
import { Message, Usage } from '../types';

export const streamOllamaCompletion = async (
  messages: Message[],
  model: string,
  baseUrl: string = 'http://localhost:11434',
  onChunk: (content: string, citations?: string[], usage?: Usage) => void,
  signal?: AbortSignal,
  systemPrompt?: string
) => {
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  if (systemPrompt) {
    apiMessages.unshift({ role: 'system', content: systemPrompt });
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: apiMessages,
      stream: true,
    }),
    signal: signal
  });

  if (!response.ok) throw new Error('Ollama connection failed. Ensure Ollama is running.');
  if (!response.body) throw new Error('Response body is null');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          onChunk(json.message.content);
        }
        if (json.done && json.eval_count) {
           onChunk('', undefined, {
               prompt_tokens: json.prompt_eval_count || 0,
               completion_tokens: json.eval_count || 0,
               total_tokens: (json.prompt_eval_count || 0) + (json.eval_count || 0)
           });
        }
      } catch (e) {
        // Ignore JSON parse errors for partial lines
      }
    }
  }
};
