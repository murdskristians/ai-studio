import Groq from 'groq-sdk';
import { BaseProvider } from './base';
import type { CompletionParams, ModelConfig, StreamChunk } from '../../types';
import { getModelsByProvider } from '../../constants/models';

export class GroqProvider extends BaseProvider {
  name = 'Groq';
  type = 'groq' as const;
  private client: Groq | null = null;

  constructor(apiKey: string) {
    super(apiKey);
    if (this.hasApiKey()) {
      this.client = new Groq({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  async *generateStream(params: CompletionParams): AsyncGenerator<StreamChunk> {
    if (!this.client) {
      throw new Error('Groq API key is not configured');
    }

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

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
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    }

    const stream = await this.client.chat.completions.create({
      model: params.model,
      messages,
      temperature: params.parameters.temperature,
      top_p: params.parameters.topP,
      max_tokens: params.parameters.maxTokens,
      stop: params.parameters.stopSequences.length > 0 ? params.parameters.stopSequences : undefined,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason !== null;

      if (content) {
        yield { text: content, done: false };
      }

      if (done) {
        yield { text: '', done: true };
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }

  getAvailableModels(): ModelConfig[] {
    return getModelsByProvider('groq');
  }
}
