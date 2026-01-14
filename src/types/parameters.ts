export interface GenerationParameters {
  temperature: number;      // 0.1-2, default 1
  topP: number;             // 0-1, default 0.95
  maxTokens: number;        // default 65535
  stopSequences: string[];  // max 5 sequences
  thinkingMode: boolean;    // enable thinking/reasoning mode
}

export const DEFAULT_PARAMETERS: GenerationParameters = {
  temperature: 1,
  topP: 0.95,
  maxTokens: 65535,
  stopSequences: [],
  thinkingMode: false,
};

export interface ParameterLimits {
  temperature: { min: number; max: number; step: number };
  topP: { min: number; max: number; step: number };
  maxTokens: { min: number; max: number; step: number };
}

export const PARAMETER_LIMITS: ParameterLimits = {
  temperature: { min: 0.1, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.01 },
  maxTokens: { min: 1, max: 65535, step: 1 },
};
