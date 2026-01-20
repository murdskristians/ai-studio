import type { ModelConfig } from '../types';

export const MODELS: ModelConfig[] = [
  // Gemini Models
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Latest fast and efficient model',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'gemini',
    description: 'Lightweight and fast model',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
];

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): ModelConfig[] => {
  return MODELS.filter(model => model.provider === provider);
};

export const getDefaultModel = (): ModelConfig => {
  return MODELS.find(m => m.id === 'gemini-2.5-flash') || MODELS[0];
};
