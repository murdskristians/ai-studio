import { BaseProvider } from './base';
import type { CompletionParams, ModelConfig, StreamChunk } from '../../types';
import { getModelsByProvider } from '../../constants/models';

export class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  type = 'openrouter' as const;
  private baseUrl = 'https://openrouter.ai/api/v1';

  async *generateStream(params: CompletionParams): AsyncGenerator<StreamChunk> {
    if (!this.hasApiKey()) {
      throw new Error('OpenRouter API key is not configured');
    }

    const messages: { role: string; content: string }[] = [];

    // Add system prompt if provided
    if (params.systemPrompt) {
      messages.push({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of params.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Studio',
      },
      body: JSON.stringify({
        model: params.model,
        messages,
        temperature: params.parameters.temperature,
        top_p: params.parameters.topP,
        max_tokens: params.parameters.maxTokens,
        stop: params.parameters.stopSequences.length > 0 ? params.parameters.stopSequences : undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { text: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { text: content, done: false };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    yield { text: '', done: true };
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.hasApiKey()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getAvailableModels(): ModelConfig[] {
    return getModelsByProvider('openrouter');
  }
}
