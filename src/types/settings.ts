import type { ProviderType } from './ai';

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  openrouter?: string;
}

export interface AppSettings {
  apiKeys: ApiKeys;
  theme: 'light' | 'dark' | 'system';
  defaultModel: string;
  defaultProvider: ProviderType;
  sidebarCollapsed: boolean;
  parameterPanelCollapsed: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  theme: 'dark',
  defaultModel: 'llama-3.1-8b-instant',
  defaultProvider: 'groq',
  sidebarCollapsed: false,
  parameterPanelCollapsed: false,
};
