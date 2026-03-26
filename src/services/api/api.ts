/**
 * API Client - localStorage-based implementation
 * All data is stored locally in the browser. AI calls go directly to Gemini.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ApiAgent,
  ApiAgentCreatePayload,
  ApiAgentUpdatePayload,
  ApiMessage,
  ApiMessageCreatePayload,
  ApiChat,
  ApiChatCreatePayload,
  ApiChatUpdatePayload,
  ApiChatSendPayload,
  ApiChatSendResponse,
} from './types';

// ============================================
// localStorage helpers
// ============================================

const STORE_PREFIX = 'ai-studio-db-';

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, data: T[]): void {
  localStorage.setItem(STORE_PREFIX + key, JSON.stringify(data));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================
// AGENTS API (Bots) - localStorage
// ============================================

export const agentsApi = {
  list: async (userId: string): Promise<ApiAgent[]> => {
    const agents = readStore<ApiAgent>('agents');
    return agents.filter(a => a.createdBy === userId);
  },

  create: async (payload: ApiAgentCreatePayload): Promise<ApiAgent> => {
    const agents = readStore<ApiAgent>('agents');
    const newAgent: ApiAgent = {
      _id: generateId(),
      name: payload.name,
      description: payload.description,
      systemPrompt: payload.systemPrompt,
      public: payload.public,
      createdBy: payload.createdBy,
      defaultParameters: { ...payload.defaultParameters },
      trainingExamples: [...payload.trainingExamples],
    };
    agents.push(newAgent);
    writeStore('agents', agents);
    return newAgent;
  },

  update: async (payload: ApiAgentUpdatePayload): Promise<ApiAgent> => {
    const agents = readStore<ApiAgent>('agents');
    const index = agents.findIndex(a => a._id === payload._id);
    if (index === -1) throw new Error('Agent not found');

    const updated: ApiAgent = {
      _id: payload._id,
      name: payload.name,
      description: payload.description,
      systemPrompt: payload.systemPrompt,
      public: payload.public,
      createdBy: payload.createdBy,
      defaultParameters: { ...payload.defaultParameters },
      trainingExamples: [...payload.trainingExamples],
    };
    agents[index] = updated;
    writeStore('agents', agents);
    return updated;
  },

  delete: async (agentId: string, _userId: string): Promise<void> => {
    const agents = readStore<ApiAgent>('agents');
    writeStore('agents', agents.filter(a => a._id !== agentId));
  },
};

// ============================================
// CHATS API (Conversations) - localStorage
// ============================================

export const chatsApi = {
  list: async (userId: string): Promise<ApiChat[]> => {
    const chats = readStore<ApiChat>('chats');
    return chats.filter(c => c.userId === userId);
  },

  create: async (payload: ApiChatCreatePayload): Promise<ApiChat> => {
    const chats = readStore<ApiChat>('chats');
    const newChat: ApiChat = {
      _id: generateId(),
      agentId: payload.agentId,
      userId: payload.userId,
      name: payload.name,
      createdAt: Date.now(),
    };
    chats.push(newChat);
    writeStore('chats', chats);
    return newChat;
  },

  update: async (payload: ApiChatUpdatePayload): Promise<ApiChat> => {
    const chats = readStore<ApiChat>('chats');
    const index = chats.findIndex(c => c._id === payload._id);
    if (index === -1) throw new Error('Chat not found');

    if (payload.name !== undefined) chats[index].name = payload.name;
    if (payload.agentId !== undefined) chats[index].agentId = payload.agentId;
    writeStore('chats', chats);
    return chats[index];
  },

  delete: async (chatId: string): Promise<void> => {
    const chats = readStore<ApiChat>('chats');
    writeStore('chats', chats.filter(c => c._id !== chatId));
    // Also delete associated messages
    const messages = readStore<ApiMessage>('messages');
    writeStore('messages', messages.filter(m => m.chatId !== chatId));
  },

  /**
   * Send a message to AI and get response.
   * Calls Gemini directly from the client, saves messages to localStorage.
   */
  send: async (payload: ApiChatSendPayload, signal?: AbortSignal): Promise<ApiChatSendResponse> => {
    // Save user message
    const userMsg: ApiMessage = {
      _id: generateId(),
      chatId: payload.chatId,
      content: payload.message,
      type: 'human',
    };
    const allMessages = readStore<ApiMessage>('messages');
    allMessages.push(userMsg);
    writeStore('messages', allMessages);

    // Get the agent's config for system prompt and parameters
    const agents = readStore<ApiAgent>('agents');
    const agent = agents.find(a => a._id === payload.agentId);

    // Get conversation history for this chat
    const chatMessages = allMessages.filter(m => m.chatId === payload.chatId);
    const history = chatMessages.slice(0, -1).map(m => ({
      role: m.type === 'human' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    // Read API key from settings in localStorage
    const settingsRaw = localStorage.getItem('ai-studio-settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    const apiKey = settings?.apiKeys?.gemini;

    if (!apiKey) {
      throw new Error(
        'Gemini API key not configured. Go to Settings and add your Gemini API key.'
      );
    }

    // Call Gemini directly
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = agent?.defaultParameters?.modelName || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: agent?.systemPrompt || undefined,
      generationConfig: {
        temperature: agent?.defaultParameters?.temperature ?? 1,
        topP: agent?.defaultParameters?.topP ?? 0.95,
        maxOutputTokens: agent?.defaultParameters?.maxTokens ?? 8192,
        stopSequences:
          agent?.defaultParameters?.stopSequences?.length
            ? agent.defaultParameters.stopSequences
            : undefined,
      },
    });

    const chat = model.startChat({ history });

    // Check abort before calling
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const result = await chat.sendMessage(payload.message);
    const responseText = result.response.text();

    // Save AI response message
    const aiMsg: ApiMessage = {
      _id: generateId(),
      chatId: payload.chatId,
      content: responseText,
      type: 'ai',
    };
    const updatedMessages = readStore<ApiMessage>('messages');
    updatedMessages.push(aiMsg);
    writeStore('messages', updatedMessages);

    return {
      chatId: payload.chatId,
      response: responseText,
    };
  },
};

// ============================================
// MESSAGES API - localStorage
// ============================================

export const messagesApi = {
  list: async (chatId: string): Promise<ApiMessage[]> => {
    const messages = readStore<ApiMessage>('messages');
    return messages.filter(m => m.chatId === chatId);
  },

  create: async (payload: ApiMessageCreatePayload): Promise<ApiMessage> => {
    const messages = readStore<ApiMessage>('messages');
    const newMsg: ApiMessage = {
      _id: generateId(),
      chatId: payload.chatId,
      content: payload.content,
      type: payload.type,
    };
    messages.push(newMsg);
    writeStore('messages', messages);
    return newMsg;
  },

  delete: async (messageId: string): Promise<void> => {
    const messages = readStore<ApiMessage>('messages');
    writeStore('messages', messages.filter(m => m._id !== messageId));
  },
};

// ============================================
// PERFORMANCE API (AI Analysis via chats-send)
// ============================================

export interface PerformanceAnalyzeParams {
  prompt: string;
  agentId: string;
  chatId: string;
}

export const performanceApi = {
  createAnalysisChat: async (agentId: string, employeeName: string, userId: string): Promise<ApiChat> => {
    return chatsApi.create({
      agentId,
      userId,
      name: `Performance Analysis - ${employeeName}`,
    });
  },

  analyze: async (params: PerformanceAnalyzeParams): Promise<{ response: string }> => {
    const result = await chatsApi.send({
      message: params.prompt,
      agentId: params.agentId,
      chatId: params.chatId,
    });
    return { response: result.response };
  },
};
