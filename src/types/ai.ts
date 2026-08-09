import type { GenerationParameters } from './parameters';

export type ProviderType = 'gemini' | 'groq' | 'openrouter';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  isFree: boolean;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  /**
   * Reasoning models think before answering. Left alone, some return that
   * thinking as `<think>…</think>` inside the reply. Groq strips it when sent
   * `reasoning_format`, but rejects that parameter outright (HTTP 400) for
   * models that do not reason — so it has to be set per model.
   */
  supportsReasoningFormat: boolean;
}

export interface CompletionParams {
  model: string;
  messages: MessageForAPI[];
  systemPrompt?: string;
  parameters: GenerationParameters;
}

export interface MessageForAPI {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface AIProvider {
  name: string;
  type: ProviderType;

  generateStream(params: CompletionParams): AsyncGenerator<StreamChunk>;
  validateApiKey(): Promise<boolean>;
  getAvailableModels(): ModelConfig[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
