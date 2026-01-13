import type { ProviderType } from './ai';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  botId?: string;
  modelId: string;
  providerId: ProviderType;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  botId?: string;
  modelId: string;
  providerId: ProviderType;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  preview: string;
}
