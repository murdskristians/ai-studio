import type { ModelConfig } from '../types';

export const MODELS: ModelConfig[] = [
  // Gemini Models
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'gemini',
    description: 'Latest fast and efficient model',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    description: 'Most cost-efficient, low-latency model',
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
  return MODELS.find(m => m.id === 'gemini-3.5-flash') || MODELS[0];
};
