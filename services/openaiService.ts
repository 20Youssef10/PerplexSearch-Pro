import { Message, Usage } from '../types';

export const streamOpenAICompletion = async (
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (content: string, citations?: string[], usage?: Usage) => void,
  signal?: AbortSignal,
  systemPrompt?: string
) => {
  // Check if model is o1 series (o1-preview, o1-mini)
  const isO1 = model.startsWith('o1');

  // Filter messages to format them for API
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  if (systemPrompt) {
    if (isO1) {
      // o1 models do not support 'system' role. Prepend system prompt to the first user message.
      const firstUserIndex = apiMessages.findIndex(m => m.role === 'user');
      if (firstUserIndex !== -1) {
        apiMessages[firstUserIndex].content = `System Instruction: ${systemPrompt}\n\nUser Query: ${apiMessages[firstUserIndex].content}`;
      } else {
        // Fallback if no user message starts the conversation
        apiMessages.unshift({
          role: 'user',
          content: `System Instruction: ${systemPrompt}`
        });
      }
    } else {
      // Standard GPT models support system role
      apiMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        stream: true
      }),
      signal: signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API Error: ${response.statusText}`);
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
        if (dataStr === '[DONE]') continue;

        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) onChunk(content);
          
          if (json.usage) {
             onChunk('', undefined, {
                prompt_tokens: json.usage.prompt_tokens,
                completion_tokens: json.usage.completion_tokens,
                total_tokens: json.usage.total_tokens
             });
          }
        } catch (e) {
          console.warn('Error parsing OpenAI chunk', e);
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    throw error;
  }
};