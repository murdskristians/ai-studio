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
  // Groq Models (2026)
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'groq',
    description: 'Fast, lightweight Llama model',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'groq',
    description: 'Powerful Llama 3.3 model',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'groq',
    description: 'Llama 4 Scout model (Preview)',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    provider: 'groq',
    description: 'Qwen 3 model (Preview)',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },

  // OpenRouter Models (Free tier - 2026)
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'openrouter',
    description: 'Powerful Llama 3.3 via OpenRouter',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'openrouter',
    description: 'Google Gemma 3 via OpenRouter',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'openrouter',
    description: 'DeepSeek R1 reasoning model',
    contextWindow: 64000,
    maxOutputTokens: 4096,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen 3 Coder (Free)',
    provider: 'openrouter',
    description: 'Qwen 3 coding model',
    contextWindow: 32768,
    maxOutputTokens: 4096,
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
