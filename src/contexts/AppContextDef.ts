import { createContext } from 'react';
import type { Bot, Conversation, Message, GenerationParameters, ModelConfig, AppSettings } from '../types';

export interface AppState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  selectedModel: ModelConfig;
  setSelectedModel: (modelId: string) => void;
  parameters: GenerationParameters;
  setParameters: (params: GenerationParameters) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  bots: Bot[];
  currentBot: Bot | null;
  setCurrentBot: (bot: Bot | null) => void;
  createBot: (bot?: Partial<Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>>) => Bot;
  updateBot: (id: string, updates: Partial<Bot>) => void;
  deleteBot: (id: string) => void;
  exportBot: (id: string) => void;
  exportDefaultAssistant: () => void;
  exportAllBots: () => void;
  importBots: (file: File) => Promise<number>;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => Conversation;
  loadConversation: (id: string) => void;
  saveCurrentConversation: () => void;
  deleteConversation: (id: string) => void;
  isLoading: boolean;
  streamingMessageId: string | null;
  sendMessage: (
    content: string,
    targetBot?: Bot | null,
    setTargetMessages?: (msgs: Message[]) => void,
    setTargetStreamingId?: (id: string | null) => void,
    setIsLoadingTarget?: (loading: boolean) => void
  ) => Promise<void>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  parameterPanelCollapsed: boolean;
  setParameterPanelCollapsed: (collapsed: boolean) => void;
  comparisonMode: boolean;
  setComparisonMode: (enabled: boolean) => void;
  comparingBots: [Bot | null, Bot | null];
  setComparingBots: (bots: [Bot | null, Bot | null]) => void;
}

export const AppContext = createContext<AppState | null>(null);
