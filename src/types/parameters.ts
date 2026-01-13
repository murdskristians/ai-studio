export interface GenerationParameters {
  temperature: number;      // 0-2, default 1
  topP: number;             // 0-1, default 0.95
  topK: number;             // 1-100, default 40
  maxTokens: number;        // default 2048
  stopSequences: string[];  // max 5 sequences
}

export const DEFAULT_PARAMETERS: GenerationParameters = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxTokens: 2048,
  stopSequences: [],
};

export interface ParameterLimits {
  temperature: { min: number; max: number; step: number };
  topP: { min: number; max: number; step: number };
  topK: { min: number; max: number; step: number };
  maxTokens: { min: number; max: number; step: number };
}

export const PARAMETER_LIMITS: ParameterLimits = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.05 },
  topK: { min: 1, max: 100, step: 1 },
  maxTokens: { min: 1, max: 8192, step: 1 },
};
