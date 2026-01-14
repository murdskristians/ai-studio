import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base';
import type { CompletionParams, ModelConfig, StreamChunk } from '../../types';
import { getModelsByProvider } from '../../constants/models';

export class GeminiProvider extends BaseProvider {
  name = 'Google Gemini';
  type = 'gemini' as const;
  private client: GoogleGenerativeAI | null = null;

  constructor(apiKey: string) {
    super(apiKey);
    if (this.hasApiKey()) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async *generateStream(params: CompletionParams): AsyncGenerator<StreamChunk> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured');
    }

    const model = this.client.getGenerativeModel({
      model: params.model,
      systemInstruction: params.systemPrompt,
      generationConfig: {
        temperature: params.parameters.temperature,
        topP: params.parameters.topP,
        maxOutputTokens: params.parameters.maxTokens,
        stopSequences: params.parameters.stopSequences.length > 0 ? params.parameters.stopSequences : undefined,
      },
    });

    // Convert messages to Gemini format
    const history = params.messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = params.messages[params.messages.length - 1];

    const chat = model.startChat({
      history: history as { role: 'user' | 'model'; parts: { text: string }[] }[],
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { text, done: false };
      }
    }

    yield { text: '', done: true };
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Hi');
      return true;
    } catch {
      return false;
    }
  }

  getAvailableModels(): ModelConfig[] {
    return getModelsByProvider('gemini');
  }
}
