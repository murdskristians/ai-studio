/**
 * Data Transformers - Convert between app types and API types
 */

import type { Bot, TrainingExample } from '../../types/bot';
import type { Message, Conversation } from '../../types/conversation';
import { DEFAULT_PARAMETERS } from '../../types/parameters';
import type {
  ApiAgent,
  ApiAgentCreatePayload,
  ApiAgentUpdatePayload,
  ApiTrainingExample,
  ApiMessage,
  ApiMessageCreatePayload,
  ApiMessageType,
  ApiChat,
  ApiChatCreatePayload,
  ApiChatUpdatePayload,
} from './types';

// ============================================
// BOT <-> AGENT TRANSFORMERS
// ============================================

/**
 * Transform API Agent to App Bot
 */
export function apiAgentToBot(agent: ApiAgent): Bot {
  return {
    id: agent._id,
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    preferredModel: agent.defaultParameters.modelName || undefined,
    preferredProvider: undefined, // API doesn't store this
    defaultParameters: {
      temperature: agent.defaultParameters.temperature,
      topP: agent.defaultParameters.topP,
      maxTokens: agent.defaultParameters.maxTokens,
      stopSequences: agent.defaultParameters.stopSequences,
      thinkingMode: agent.defaultParameters.thinkingMode,
    },
    trainingExamples: agent.trainingExamples.map(apiTrainingExampleToApp),
    createdAt: Date.now(), // API doesn't return this
    updatedAt: Date.now(), // API doesn't return this
  };
}

/**
 * Transform App Bot to API Agent Create Payload
 */
export function botToApiAgentCreatePayload(bot: Partial<Bot>, userId: string): ApiAgentCreatePayload {
  const params = bot.defaultParameters || DEFAULT_PARAMETERS;
  return {
    name: bot.name || 'New Bot',
    description: bot.description || '',
    systemPrompt: bot.systemPrompt || '',
    public: 'false',
    createdBy: userId,
    defaultParameters: {
      modelName: bot.preferredModel || '',
      temperature: params.temperature,
      topP: params.topP,
      maxTokens: params.maxTokens,
      stopSequences: params.stopSequences,
      thinkingMode: params.thinkingMode,
    },
    trainingExamples: (bot.trainingExamples || []).map(appTrainingExampleToApi),
    userId,
  };
}

/**
 * Transform App Bot to API Agent Update Payload
 */
export function botToApiAgentUpdatePayload(bot: Bot, userId: string): ApiAgentUpdatePayload {
  return {
    ...botToApiAgentCreatePayload(bot, userId),
    _id: bot.id,
  };
}

// ============================================
// TRAINING EXAMPLE TRANSFORMERS
// ============================================

function apiTrainingExampleToApp(example: ApiTrainingExample): TrainingExample {
  return {
    id: example._id,
    input: example.input,
    output: example.output,
    enabled: example.enabled,
  };
}

function appTrainingExampleToApi(example: TrainingExample): ApiTrainingExample {
  return {
    _id: example.id,
    input: example.input,
    output: example.output,
    enabled: example.enabled,
  };
}

// ============================================
// MESSAGE TRANSFORMERS
// ============================================

/**
 * Map app role to API type
 */
function roleToApiType(role: 'user' | 'assistant' | 'system'): ApiMessageType {
  switch (role) {
    case 'user':
      return 'human';
    case 'assistant':
      return 'ai';
    case 'system':
      return 'system';
  }
}

/**
 * Map API type to app role
 */
function apiTypeToRole(type: ApiMessageType): 'user' | 'assistant' | 'system' {
  switch (type) {
    case 'human':
      return 'user';
    case 'ai':
      return 'assistant';
    case 'system':
      return 'system';
  }
}

/**
 * Transform API Message to App Message
 */
export function apiMessageToApp(message: ApiMessage): Message {
  return {
    id: message._id,
    role: apiTypeToRole(message.type),
    content: message.content,
    timestamp: Date.now(), // API doesn't store this
    model: undefined, // API doesn't store this
  };
}

/**
 * Transform App Message to API Message Create Payload
 */
export function messageToApiCreatePayload(message: Message, chatId: string): ApiMessageCreatePayload {
  return {
    chatId,
    content: message.content,
    type: roleToApiType(message.role),
  };
}

// ============================================
// CONVERSATION <-> CHAT TRANSFORMERS
// ============================================

/**
 * Transform API Chat to App Conversation (partial - messages loaded separately)
 */
export function apiChatToConversation(chat: ApiChat, messages: Message[] = []): Conversation {
  return {
    id: chat._id,
    title: chat.name,
    botId: chat.agentId || undefined,
    modelId: '', // API doesn't store this
    providerId: 'gemini', // API doesn't store this, default to gemini
    messages,
    createdAt: chat.createdAt || Date.now(),
    updatedAt: chat.createdAt || Date.now(), // API doesn't have updatedAt
  };
}

/**
 * Transform App Conversation to API Chat Create Payload
 */
export function conversationToApiChatCreatePayload(
  conversation: Partial<Conversation>,
  userId: string
): ApiChatCreatePayload {
  return {
    agentId: conversation.botId || '',
    userId,
    name: conversation.title || 'New Chat',
  };
}

/**
 * Transform App Conversation to API Chat Update Payload
 */
export function conversationToApiChatUpdatePayload(conversation: Conversation): ApiChatUpdatePayload {
  return {
    _id: conversation.id,
    name: conversation.title,
    agentId: conversation.botId,
  };
}
