export interface ApiKeys {
  gemini?: string;
  groq?: string;
  openrouter?: string;
}

export interface AppSettings {
  apiKeys: ApiKeys;
  sidebarCollapsed: boolean;
  parameterPanelCollapsed: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  sidebarCollapsed: false,
  parameterPanelCollapsed: false,
};
