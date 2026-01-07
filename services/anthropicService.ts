import { Message, Usage } from '../types';

export const streamAnthropicCompletion = async (
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (content: string, citations?: string[], usage?: Usage) => void,
  signal?: AbortSignal,
  systemPrompt?: string
) => {
  // Anthropic format: system prompt is a top-level parameter, not a message
  const apiMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true' // Required for client-side usage if supported
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        system: systemPrompt,
        stream: true,
        max_tokens: 4096
      }),
      signal: signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check for CORS or standard errors
      if (response.status === 0 || response.status === 401 && !errorData.error) {
        throw new Error("Connection failed. This is likely due to CORS restrictions on Anthropic API in the browser. Please use a proxy or a different model.");
      }
      throw new Error(errorData.error?.message || `Anthropic API Error: ${response.statusText}`);
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        const dataStr = trimmed.replace('data: ', '');
        
        try {
          const json = JSON.parse(dataStr);
          if (json.type === 'content_block_delta' && json.delta?.text) {
             onChunk(json.delta.text);
          }
          if (json.type === 'message_stop' && json['amazon-bedrock-invocation-metrics']) {
             // Handle usage if available
          }
        } catch (e) {
          console.warn('Error parsing Anthropic chunk', e);
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    throw error;
  }
};