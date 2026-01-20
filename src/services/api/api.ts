/**
 * API Client - Handles all API calls to the backend
 */

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

const API_BASE = 'https://server1.gpark.digital/8084';

/**
 * Generic POST request helper
 */
async function post<T>(endpoint: string, body: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}/?api=${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text || text.trim() === '') {
    return [] as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // If parsing fails, return empty array for list endpoints
    return [] as unknown as T;
  }
}

// ============================================
// AGENTS API (Bots)
// ============================================

export const agentsApi = {
  /**
   * List all agents for a user
   */
  list: async (userId: string): Promise<ApiAgent[]> => {
    const result = await post<ApiAgent[] | { data: ApiAgent[] }>('agents-list', { userId });
    // Handle both array response and { data: [...] } response
    return Array.isArray(result) ? result : result.data || [];
  },

  /**
   * Create a new agent
   */
  create: async (payload: ApiAgentCreatePayload): Promise<ApiAgent> => {
    return post<ApiAgent>('agents-create', payload);
  },

  /**
   * Update an existing agent
   */
  update: async (payload: ApiAgentUpdatePayload): Promise<ApiAgent> => {
    return post<ApiAgent>('agents-update', payload);
  },

  /**
   * Delete an agent
   */
  delete: async (agentId: string, userId: string): Promise<void> => {
    await post<unknown>('agents-delete', { _id: agentId, userId });
  },
};

// ============================================
// CHATS API (Conversations)
// ============================================

export const chatsApi = {
  /**
   * List all chats for a user
   */
  list: async (userId: string): Promise<ApiChat[]> => {
    const result = await post<ApiChat[] | { data: ApiChat[] }>('chats-list', { userId });
    return Array.isArray(result) ? result : result.data || [];
  },

  /**
   * Create a new chat
   */
  create: async (payload: ApiChatCreatePayload): Promise<ApiChat> => {
    return post<ApiChat>('chats-create', payload);
  },

  /**
   * Update an existing chat
   */
  update: async (payload: ApiChatUpdatePayload): Promise<ApiChat> => {
    return post<ApiChat>('chats-update', payload);
  },

  /**
   * Delete a chat
   */
  delete: async (chatId: string): Promise<void> => {
    await post<unknown>('chats-delete', { _id: chatId });
  },

  /**
   * Send a message to AI and get response
   * Backend handles: calling Gemini, saving user message, saving AI response
   */
  send: async (payload: ApiChatSendPayload, signal?: AbortSignal): Promise<ApiChatSendResponse> => {
    return post<ApiChatSendResponse>('chats-send', payload, signal);
  },
};

// ============================================
// MESSAGES API
// ============================================

export const messagesApi = {
  /**
   * List all messages for a chat
   */
  list: async (chatId: string): Promise<ApiMessage[]> => {
    const result = await post<ApiMessage[] | { data: ApiMessage[] }>('messages-list', { chatId });
    return Array.isArray(result) ? result : result.data || [];
  },

  /**
   * Create a new message
   */
  create: async (payload: ApiMessageCreatePayload): Promise<ApiMessage> => {
    return post<ApiMessage>('messages-create', payload);
  },

  /**
   * Delete a message
   */
  delete: async (messageId: string): Promise<void> => {
    await post<unknown>('messages-delete', { _id: messageId });
  },
};
