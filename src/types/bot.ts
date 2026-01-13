import type { GenerationParameters } from './parameters';
import type { ProviderType } from './ai';

export interface Bot {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  preferredModel?: string;
  preferredProvider?: ProviderType;
  defaultParameters: GenerationParameters;
  createdAt: number;
  updatedAt: number;
}

export interface BotFormData {
  name: string;
  description: string;
  systemPrompt: string;
  preferredModel?: string;
  preferredProvider?: ProviderType;
  defaultParameters: GenerationParameters;
}
