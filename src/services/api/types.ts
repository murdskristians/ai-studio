/**
 * API Types - These match the backend API format
 */

// Agent (Bot) API types
export interface ApiAgentDefaultParameters {
  modelName: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences: string[];
  thinkingMode: boolean;
}

export interface ApiTrainingExample {
  _id: string;
  input: string;
  output: string;
  enabled: boolean;
}

export interface ApiAgent {
  _id: string;
  name: string;
  description: string;
  systemPrompt: string;
  public: string; // "true" or "false" as string
  createdBy: string;
  defaultParameters: ApiAgentDefaultParameters;
  trainingExamples: ApiTrainingExample[];
}

export interface ApiAgentCreatePayload {
  name: string;
  description: string;
  systemPrompt: string;
  public: string;
  createdBy: string;
  defaultParameters: ApiAgentDefaultParameters;
  trainingExamples: ApiTrainingExample[];
  userId: string;
}

export interface ApiAgentUpdatePayload extends ApiAgentCreatePayload {
  _id: string;
}

// Message API types
export type ApiMessageType = 'ai' | 'system' | 'human';

export interface ApiMessage {
  _id: string;
  chatId: string;
  content: string;
  type: ApiMessageType;
}

export interface ApiMessageCreatePayload {
  chatId: string;
  content: string;
  type: ApiMessageType;
}

// Chat (Conversation) API types
export interface ApiChat {
  _id: string;
  agentId: string;
  userId: string;
  name: string;
  createdAt: number;
}

export interface ApiChatCreatePayload {
  agentId: string;
  userId: string;
  name: string;
}

export interface ApiChatUpdatePayload {
  _id: string;
  name?: string;
  agentId?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
