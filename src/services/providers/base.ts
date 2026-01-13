import type { AIProvider, CompletionParams, ModelConfig, ProviderType, StreamChunk } from '../../types';

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract type: ProviderType;
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract generateStream(params: CompletionParams): AsyncGenerator<StreamChunk>;
  abstract validateApiKey(): Promise<boolean>;
  abstract getAvailableModels(): ModelConfig[];

  protected hasApiKey(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }
}
