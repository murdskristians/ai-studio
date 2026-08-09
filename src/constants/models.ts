import type { ModelConfig } from '../types';

/**
 * Groq models.
 *
 * ids and limits were read from https://api.groq.com/openai/v1/models rather
 * than from documentation, because a model that has been retired still reads
 * perfectly plausibly in source and only fails once a user sends a message.
 * Re-check with that endpoint before adding to this list.
 *
 * MODELS[0] is the fallback: AppContext resets any saved bot whose model is no
 * longer in this list, so keep the most generally useful model first.
 */
export const MODELS: ModelConfig[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'groq',
    description: 'Most capable all-round model',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsReasoningFormat: false,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'groq',
    description: 'Fastest and cheapest, best for short turns',
    contextWindow: 131072,
    maxOutputTokens: 131072,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsReasoningFormat: false,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'groq',
    description: 'Large open-weight model, strong at reasoning',
    contextWindow: 131072,
    maxOutputTokens: 65536,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsReasoningFormat: true,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'groq',
    description: 'Smaller open-weight model, quicker responses',
    contextWindow: 131072,
    maxOutputTokens: 65536,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsReasoningFormat: true,
  },
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B',
    provider: 'groq',
    description: 'Balanced alternative with a different style',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    isFree: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    supportsReasoningFormat: true,
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): ModelConfig[] => {
  return MODELS.filter(model => model.provider === provider);
};

export const getDefaultModel = (): ModelConfig => {
  return MODELS[0];
};
