export interface GenerationParameters {
  temperature: number; // 0.1-2, default 1
  topP: number; // 0-1, default 0.95
  maxTokens: number; // default 4096, see note below
  stopSequences: string[]; // max 5 sequences
  thinkingMode: boolean; // enable thinking/reasoning mode
}

/**
 * maxTokens is a reservation, not a target: Groq counts the full
 * max_completion_tokens against the per-minute token budget, so asking for
 * more than the tier allows fails the request outright with HTTP 413 even when
 * the reply would have been two words. Free-tier limits sit around 8k-12k per
 * minute, so the default stays well under that and can be raised per bot.
 */
export const DEFAULT_PARAMETERS: GenerationParameters = {
  temperature: 1,
  topP: 0.95,
  maxTokens: 4096,
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
