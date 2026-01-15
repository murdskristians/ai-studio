import type { GenerationParameters } from './parameters';
import type { ProviderType } from './ai';

export interface TrainingExample {
  id: string;
  input: string;
  output: string;
  enabled: boolean;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  preferredModel?: string;
  preferredProvider?: ProviderType;
  defaultParameters: GenerationParameters;
  trainingExamples?: TrainingExample[];
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
