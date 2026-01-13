import type { AIProvider, ProviderType } from '../../types';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';

export function createProvider(type: ProviderType, apiKey: string): AIProvider {
  switch (type) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'groq':
      return new GroqProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

export { GeminiProvider } from './gemini';
export { GroqProvider } from './groq';
export { OpenRouterProvider } from './openrouter';
