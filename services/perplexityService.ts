import { Message, PerplexityResponseChunk, Usage } from '../types';
import { API_ENDPOINT } from '../constants';

export const streamCompletion = async (
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (content: string, citations?: string[], usage?: Usage) => void,
  signal?: AbortSignal,
  systemPrompt?: string
) => {
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Inject system prompt if present
  if (systemPrompt) {
    apiMessages.unshift({
      role: 'system',
      content: systemPrompt
    });
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: apiMessages,
      stream: true,
      return_citations: true
    }),
    signal: signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Process all complete lines
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.replace('data: ', '');
        if (dataStr === '[DONE]') continue;

        try {
          const json: PerplexityResponseChunk = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || '';
          const citations = json.citations;
          const usage = json.usage;
          
          onChunk(content, citations, usage);
        } catch (e) {
          console.warn('Error parsing stream chunk', e);
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Stream aborted by user, not a real error
      return;
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
};