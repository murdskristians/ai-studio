import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Bot,
  Conversation,
  Message,
  GenerationParameters,
  ModelConfig,
  AppSettings,
  TrainingExample,
} from '../types';
import { DEFAULT_PARAMETERS } from '../types/parameters';
import { DEFAULT_SETTINGS } from '../types/settings';
import { getItem, setItem, STORAGE_KEYS } from '../services/storage';
import { createProvider } from '../services/providers';
import { MODELS, getModelById } from '../constants/models';
import { AppContext, type AppState } from './AppContextDef';
import { useUserId } from './useUser';
import {
  agentsApi,
  chatsApi,
  messagesApi,
  apiAgentToBot,
  botToApiAgentCreatePayload,
  botToApiAgentUpdatePayload,
  apiChatToConversation,
  conversationToApiChatCreatePayload,
  apiMessageToApp,
  messageToApiCreatePayload,
} from '../services/api';

// Helper function to format training examples for the API
function formatTrainingExamples(examples: TrainingExample[]): string {
  const enabledExamples = examples.filter(ex => ex.enabled);
  if (enabledExamples.length === 0) return '';

  return enabledExamples
    .map(ex => `input: ${ex.input}\noutput: ${ex.output}`)
    .join('\n\n');
}

interface AppProviderProps {
  readonly children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const userId = useUserId();

  // Settings - still use localStorage
  const [settings, setSettings] = useState<AppSettings>(() =>
    getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  // Loading states for API data
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Bots - now loaded from API
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBotValue, setCurrentBotValue] = useState<Bot | null>(null);

  // Model selection
  const [selectedModelValue, setSelectedModelValue] = useState<ModelConfig>(
    () => {
      const saved = settings.defaultModel;
      return getModelById(saved) || MODELS[0];
    }
  );

  // Parameters - initialize with defaults, updated when bot is loaded
  const [parameters, setParameters] = useState<GenerationParameters>(DEFAULT_PARAMETERS);

  // System prompt
  const [systemPrompt, setSystemPrompt] = useState('');

  // Training examples
  const [trainingExamples, setTrainingExamplesState] = useState<TrainingExample[]>([]);

  // Messages - still stored locally per bot session
  const [botMessages, setBotMessages] = useState<Record<string, Message[]>>(
    () => getItem(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', {})
  );
  const [messages, setMessages] = useState<Message[]>([]);

  // Conversations - now loaded from API
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // UI state - still use localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    settings.sidebarCollapsed
  );
  const [parameterPanelCollapsed, setParameterPanelCollapsed] = useState(
    settings.parameterPanelCollapsed
  );
  const [comparisonMode, setComparisonMode] = useState(() =>
    getItem(STORAGE_KEYS.COMPARISON_MODE, false)
  );
  const [comparingBots, setComparingBots] = useState<[Bot | null, Bot | null]>([null, null]);

  // Load bots from API on mount
  useEffect(() => {
    if (!userId) {
      setIsLoadingBots(false);
      return;
    }

    const loadBots = async () => {
      try {
        setIsLoadingBots(true);
        const apiAgents = await agentsApi.list(userId);
        const loadedBots = apiAgents.map(apiAgentToBot);
        setBots(loadedBots);

        // Restore current bot selection from localStorage
        const savedBotId = getItem<string | null>(STORAGE_KEYS.CURRENT_BOT, null);
        if (savedBotId) {
          const savedBot = loadedBots.find(b => b.id === savedBotId);
          if (savedBot) {
            setCurrentBotValue(savedBot);
            setSystemPrompt(savedBot.systemPrompt);
            setParameters(savedBot.defaultParameters);
            setTrainingExamplesState(savedBot.trainingExamples || []);
            if (savedBot.preferredModel) {
              const model = getModelById(savedBot.preferredModel);
              if (model) setSelectedModelValue(model);
            }
            // Load messages for this bot
            const savedBotMessages = getItem<Record<string, Message[]>>(
              STORAGE_KEYS.CONVERSATIONS + '_bot_messages', {}
            );
            setMessages(savedBotMessages[savedBotId] || []);
          }
        }

        // Restore comparing bots
        const savedComparingIds = getItem<[string | null, string | null]>(
          STORAGE_KEYS.COMPARING_BOTS, [null, null]
        );
        setComparingBots([
          savedComparingIds[0] ? loadedBots.find(b => b.id === savedComparingIds[0]) || null : null,
          savedComparingIds[1] ? loadedBots.find(b => b.id === savedComparingIds[1]) || null : null,
        ]);
      } catch (error) {
        console.error('Failed to load bots from API:', error);
      } finally {
        setIsLoadingBots(false);
      }
    };

    loadBots();
  }, [userId]);

  // Load chats from API on mount
  useEffect(() => {
    if (!userId) {
      setIsLoadingChats(false);
      return;
    }

    const loadChats = async () => {
      try {
        setIsLoadingChats(true);
        const apiChats = await chatsApi.list(userId);
        const loadedConversations = apiChats.map(chat => apiChatToConversation(chat));
        setConversations(loadedConversations);
      } catch (error) {
        console.error('Failed to load chats from API:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [userId]);

  // Persist settings to localStorage
  useEffect(() => {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Persist bot messages to localStorage (still local for now)
  useEffect(() => {
    setItem(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', botMessages);
  }, [botMessages]);

  // Persist current bot selection to localStorage
  useEffect(() => {
    setItem(STORAGE_KEYS.CURRENT_BOT, currentBotValue?.id || null);
  }, [currentBotValue]);

  // Persist comparison mode state
  useEffect(() => {
    setItem(STORAGE_KEYS.COMPARISON_MODE, comparisonMode);
  }, [comparisonMode]);

  // Persist comparing bots (store IDs only)
  useEffect(() => {
    const botIds: [string | null, string | null] = [
      comparingBots[0]?.id || null,
      comparingBots[1]?.id || null,
    ];
    setItem(STORAGE_KEYS.COMPARING_BOTS, botIds);
  }, [comparingBots]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setSelectedModel = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModelValue(model);
      // Update the current bot's preferredModel if a bot is selected
      if (currentBotValue && userId) {
        const updatedBot = { ...currentBotValue, preferredModel: modelId, updatedAt: Date.now() };
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id ? updatedBot : bot
          )
        );
        setCurrentBotValue(updatedBot);
        // Update in API
        agentsApi.update(botToApiAgentUpdatePayload(updatedBot, userId)).catch(console.error);
      } else {
        // Save as default model in settings when using Default Assistant
        setSettings((prev) => ({ ...prev, defaultModel: modelId }));
      }
    }
  }, [currentBotValue, userId]);

  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>): Message => {
      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  // Note: updateMessage and deleteMessage removed - API doesn't support them
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
  }, []);

  const setCurrentBot = useCallback(
    (bot: Bot | null) => {
      const currentBotId = currentBotValue?.id ?? 'default';
      const newBotId = bot?.id ?? 'default';

      if (currentBotId !== newBotId) {
        setBotMessages((prev) => ({
          ...prev,
          [currentBotId]: messages,
        }));
      }

      setCurrentBotValue(bot);
      setCurrentConversation(null);

      const newBotMessages = botMessages[newBotId] ?? [];
      setMessages(newBotMessages);

      if (bot) {
        setSystemPrompt(bot.systemPrompt);
        setParameters(bot.defaultParameters);
        setTrainingExamplesState(bot.trainingExamples || []);
        if (bot.preferredModel) {
          // Use raw setter to avoid race condition with setSelectedModel
          // (which would overwrite currentBotValue with stale value)
          const model = getModelById(bot.preferredModel);
          if (model) {
            setSelectedModelValue(model);
          }
        }
      } else {
        setSystemPrompt('');
        setParameters(DEFAULT_PARAMETERS);
        setTrainingExamplesState([]);
      }
    },
    [currentBotValue?.id, messages, botMessages]
  );

  const createBot = useCallback(
    async (botData?: Partial<Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Bot> => {
      if (!userId) {
        throw new Error('User not logged in');
      }

      // Generate bot name
      let botName = botData?.name;
      if (!botName) {
        const baseName = 'Default Assistant';
        const existingNames = new Set(bots.map((b) => b.name));
        existingNames.add(baseName);

        let counter = 2;
        while (existingNames.has(`${baseName} ${counter}`)) {
          counter++;
        }
        botName = `${baseName} ${counter}`;
      }

      const newBotData: Partial<Bot> = {
        name: botName,
        description: botData?.description ?? '',
        systemPrompt: botData?.systemPrompt ?? '',
        preferredModel: botData?.preferredModel,
        preferredProvider: botData?.preferredProvider,
        defaultParameters: botData?.defaultParameters ?? { ...DEFAULT_PARAMETERS },
        trainingExamples: botData?.trainingExamples ?? [],
      };

      try {
        // Create via API
        const apiAgent = await agentsApi.create(botToApiAgentCreatePayload(newBotData, userId));
        const newBot = apiAgentToBot(apiAgent);

        setBots((prev) => [...prev, newBot]);
        return newBot;
      } catch (error) {
        console.error('Failed to create bot via API:', error);
        throw error;
      }
    },
    [userId, bots]
  );

  const updateBot = useCallback(
    async (id: string, updates: Partial<Bot>) => {
      if (!userId) return;

      const currentBot = bots.find(b => b.id === id);
      if (!currentBot) return;

      const updatedBot = { ...currentBot, ...updates, updatedAt: Date.now() };

      // Update local state immediately
      setBots((prev) =>
        prev.map((bot) =>
          bot.id === id ? updatedBot : bot
        )
      );
      if (currentBotValue?.id === id) {
        setCurrentBotValue(updatedBot);
      }

      // Update via API
      try {
        await agentsApi.update(botToApiAgentUpdatePayload(updatedBot, userId));
      } catch (error) {
        console.error('Failed to update bot via API:', error);
        // Revert on error
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === id ? currentBot : bot
          )
        );
        if (currentBotValue?.id === id) {
          setCurrentBotValue(currentBot);
        }
      }
    },
    [userId, bots, currentBotValue?.id]
  );

  const updateSystemPrompt = useCallback(
    (prompt: string) => {
      setSystemPrompt(prompt);
      if (currentBotValue && userId) {
        const updatedBot = { ...currentBotValue, systemPrompt: prompt, updatedAt: Date.now() };
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id ? updatedBot : bot
          )
        );
        setCurrentBotValue(updatedBot);
        // Update in API
        agentsApi.update(botToApiAgentUpdatePayload(updatedBot, userId)).catch(console.error);
      }
    },
    [currentBotValue, userId]
  );

  const updateTrainingExamples = useCallback(
    (examples: TrainingExample[]) => {
      setTrainingExamplesState(examples);
      if (currentBotValue && userId) {
        const updatedBot = { ...currentBotValue, trainingExamples: examples, updatedAt: Date.now() };
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id ? updatedBot : bot
          )
        );
        setCurrentBotValue(updatedBot);
        // Update in API
        agentsApi.update(botToApiAgentUpdatePayload(updatedBot, userId)).catch(console.error);
      }
    },
    [currentBotValue, userId]
  );

  const updateParameters = useCallback(
    (params: GenerationParameters) => {
      setParameters(params);
      if (currentBotValue && userId) {
        const updatedBot = { ...currentBotValue, defaultParameters: params, updatedAt: Date.now() };
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id ? updatedBot : bot
          )
        );
        setCurrentBotValue(updatedBot);
        // Update in API
        agentsApi.update(botToApiAgentUpdatePayload(updatedBot, userId)).catch(console.error);
      }
    },
    [currentBotValue, userId]
  );

  const deleteBot = useCallback(
    async (id: string) => {
      if (!userId) return;

      // Update local state immediately
      setBots((prev) => prev.filter((bot) => bot.id !== id));
      if (currentBotValue?.id === id) {
        setCurrentBotValue(null);
      }

      // Delete via API
      try {
        await agentsApi.delete(id, userId);
      } catch (error) {
        console.error('Failed to delete bot via API:', error);
        // Could revert here, but deletion is less critical
      }
    },
    [userId, currentBotValue]
  );

  const reorderBots = useCallback((fromIndex: number, toIndex: number) => {
    setBots((prev) => {
      const newBots = [...prev];
      const [removed] = newBots.splice(fromIndex, 1);
      newBots.splice(toIndex, 0, removed);
      return newBots;
    });
    // Note: Order is not persisted to API - only local
  }, []);

  const exportBot = useCallback(
    (id: string) => {
      const bot = bots.find((b) => b.id === id);
      if (!bot) return;

      const exportedBot = {
        name: bot.name,
        description: bot.description,
        systemPrompt: bot.systemPrompt,
        public: 'false',
        createdBy: userId || '',
        defaultParameters: {
          modelName: bot.preferredModel || '',
          temperature: bot.defaultParameters.temperature,
          topP: bot.defaultParameters.topP,
          maxTokens: bot.defaultParameters.maxTokens,
          stopSequences: bot.defaultParameters.stopSequences,
          thinkingMode: bot.defaultParameters.thinkingMode,
        },
        trainingExamples: (bot.trainingExamples || []).map((example) => ({
          _id: example.id,
          input: example.input,
          output: example.output,
          enabled: example.enabled,
        })),
        _id: bot.id,
      };

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        bots: [exportedBot],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bot.name
        .replaceAll(/[^a-z0-9]/gi, '-')
        .toLowerCase()}-bot.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [bots, userId]
  );

  const exportDefaultAssistant = useCallback(() => {
    const defaultBot = {
      name: 'Default Assistant',
      description: '',
      systemPrompt: '',
      public: 'false',
      createdBy: userId || '',
      defaultParameters: {
        modelName: '',
        temperature: DEFAULT_PARAMETERS.temperature,
        topP: DEFAULT_PARAMETERS.topP,
        maxTokens: DEFAULT_PARAMETERS.maxTokens,
        stopSequences: DEFAULT_PARAMETERS.stopSequences,
        thinkingMode: DEFAULT_PARAMETERS.thinkingMode,
      },
      trainingExamples: [],
      _id: '',
    };

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bots: [defaultBot],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default-assistant-bot.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [userId]);

  const exportAllBots = useCallback(() => {
    if (bots.length === 0) return;

    const exportedBots = bots.map((bot) => ({
      name: bot.name,
      description: bot.description,
      systemPrompt: bot.systemPrompt,
      public: 'false',
      createdBy: userId || '',
      defaultParameters: {
        modelName: bot.preferredModel || '',
        temperature: bot.defaultParameters.temperature,
        topP: bot.defaultParameters.topP,
        maxTokens: bot.defaultParameters.maxTokens,
        stopSequences: bot.defaultParameters.stopSequences,
        thinkingMode: bot.defaultParameters.thinkingMode,
      },
      trainingExamples: (bot.trainingExamples || []).map((example) => ({
        _id: example.id,
        input: example.input,
        output: example.output,
        enabled: example.enabled,
      })),
      _id: bot.id,
    }));

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bots: exportedBots,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-studio-bots-${
      new Date().toISOString().split('T')[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bots, userId]);

  const importBots = useCallback(async (file: File): Promise<number> => {
    if (!userId) {
      throw new Error('User not logged in');
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.bots || !Array.isArray(data.bots)) {
      throw new Error('Invalid bot file format');
    }

    let importedCount = 0;

    for (const bot of data.bots) {
      if (!bot.name || !bot.defaultParameters) {
        continue;
      }

      const trainingExamples = (bot.trainingExamples || []).map((example: { _id?: string; id?: string; input: string; output: string; enabled: boolean }) => ({
        id: example._id || example.id || uuidv4(),
        input: example.input,
        output: example.output,
        enabled: example.enabled ?? true,
      }));

      const newBotData: Partial<Bot> = {
        name: bot.name,
        description: bot.description || '',
        systemPrompt: bot.systemPrompt || '',
        preferredModel: bot.preferredModel || bot.defaultParameters.modelName || undefined,
        preferredProvider: bot.preferredProvider,
        defaultParameters: {
          temperature: bot.defaultParameters.temperature ?? 1,
          topP: bot.defaultParameters.topP ?? 0.95,
          maxTokens: bot.defaultParameters.maxTokens ?? 65535,
          stopSequences: bot.defaultParameters.stopSequences || [],
          thinkingMode: bot.defaultParameters.thinkingMode ?? false,
        },
        trainingExamples,
      };

      try {
        const apiAgent = await agentsApi.create(botToApiAgentCreatePayload(newBotData, userId));
        const newBot = apiAgentToBot(apiAgent);
        setBots((prev) => [...prev, newBot]);
        importedCount++;
      } catch (error) {
        console.error('Failed to import bot:', error);
      }
    }

    return importedCount;
  }, [userId]);

  const createConversation = useCallback(async (): Promise<Conversation> => {
    if (!userId) {
      throw new Error('User not logged in');
    }

    const conversationData: Partial<Conversation> = {
      title: 'New conversation',
      botId: currentBotValue?.id,
    };

    try {
      const apiChat = await chatsApi.create(conversationToApiChatCreatePayload(conversationData, userId));
      const conversation = apiChatToConversation(apiChat);

      // Add local fields
      conversation.modelId = selectedModelValue.id;
      conversation.providerId = selectedModelValue.provider;

      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversation(conversation);
      setMessages([]);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation via API:', error);
      throw error;
    }
  }, [userId, currentBotValue, selectedModelValue]);

  const loadConversation = useCallback(
    async (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      if (!conversation) return;

      setCurrentConversation(conversation);

      // Load messages from API
      try {
        const apiMessages = await messagesApi.list(id);
        const loadedMessages = apiMessages.map(apiMessageToApp);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to load messages from API:', error);
        setMessages([]);
      }

      if (conversation.modelId) {
        setSelectedModel(conversation.modelId);
      }
      if (conversation.botId) {
        const bot = bots.find((b) => b.id === conversation.botId);
        if (bot) {
          setCurrentBotValue(bot);
          setSystemPrompt(bot.systemPrompt);
          setParameters(bot.defaultParameters);
        }
      }
    },
    [conversations, bots, setSelectedModel]
  );

  const saveCurrentConversation = useCallback(async () => {
    if (messages.length === 0 || !userId) return;

    const title = messages[0]?.content.slice(0, 50) || 'New conversation';

    if (currentConversation) {
      // Update existing conversation
      try {
        await chatsApi.update({
          _id: currentConversation.id,
          name: title,
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversation.id
              ? { ...c, title, updatedAt: Date.now() }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to update conversation:', error);
      }
    } else {
      // Create new conversation
      const conversationData: Partial<Conversation> = {
        title,
        botId: currentBotValue?.id,
      };

      try {
        const apiChat = await chatsApi.create(conversationToApiChatCreatePayload(conversationData, userId));
        const conversation = apiChatToConversation(apiChat);
        conversation.modelId = selectedModelValue.id;
        conversation.providerId = selectedModelValue.provider;

        setConversations((prev) => [conversation, ...prev]);
        setCurrentConversation(conversation);

        // Save all messages to the new chat
        for (const message of messages) {
          await messagesApi.create(messageToApiCreatePayload(message, conversation.id));
        }
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }
  }, [messages, currentConversation, currentBotValue, selectedModelValue, userId]);

  const deleteConversation = useCallback(
    async (id: string) => {
      // Update local state immediately
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }

      // Delete via API
      try {
        await chatsApi.delete(id);
      } catch (error) {
        console.error('Failed to delete conversation via API:', error);
      }
    },
    [currentConversation]
  );

  const getBotMessages = useCallback(
    (botId: string): Message[] => {
      return botMessages[botId] || [];
    },
    [botMessages]
  );

  const sendMessage = useCallback(
    async (
      content: string,
      targetBot?: Bot | null,
      setTargetMessages?: (msgs: Message[]) => void,
      setTargetStreamingId?: (id: string | null) => void,
      setIsLoadingTarget?: (loading: boolean) => void
    ): Promise<{ success: boolean; error?: string; provider?: string }> => {
      const currentMessages = targetBot
        ? botMessages[targetBot.id] || []
        : messages;
      const currentSystemPrompt = targetBot
        ? targetBot.systemPrompt
        : systemPrompt;
      const currentExamples = targetBot
        ? targetBot.trainingExamples || []
        : trainingExamples;
      const currentParameters = targetBot
        ? targetBot.defaultParameters
        : parameters;
      const currentModel = targetBot
        ? getModelById(targetBot.preferredModel || '') || selectedModelValue
        : selectedModelValue;

      const providerKey = currentModel.provider;
      const apiKey = settings.apiKeys[providerKey];
      if (!apiKey) {
        return {
          success: false,
          error: 'api_key_missing',
          provider: currentModel.provider,
        };
      }

      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...currentMessages, userMessage];

      if (targetBot) {
        setBotMessages((prev) => ({
          ...prev,
          [targetBot.id]: updatedMessages,
        }));
        if (setTargetMessages) setTargetMessages(updatedMessages);
      } else {
        setMessages(updatedMessages);
      }

      // Save user message to API if we have a current conversation
      if (currentConversation) {
        messagesApi.create(messageToApiCreatePayload(userMessage, currentConversation.id)).catch(console.error);
      }

      const assistantMessageId = uuidv4();
      setStreamingMessageId(assistantMessageId);
      if (setTargetStreamingId) setTargetStreamingId(assistantMessageId);

      setIsLoading(true);
      if (setIsLoadingTarget) setIsLoadingTarget(true);

      try {
        const provider = createProvider(currentModel.provider, apiKey);

        const messagesForApi = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const formattedExamples = formatTrainingExamples(currentExamples);
        let finalSystemPrompt = currentSystemPrompt || '';
        if (formattedExamples) {
          finalSystemPrompt = finalSystemPrompt
            ? `${finalSystemPrompt}\n\n${formattedExamples}`
            : formattedExamples;
        }

        const stream = provider.generateStream({
          model: currentModel.id,
          messages: messagesForApi,
          systemPrompt: finalSystemPrompt || undefined,
          parameters: currentParameters,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          if (chunk.text) {
            fullResponse += chunk.text;
            const streamingMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: fullResponse,
              timestamp: Date.now(),
              model: currentModel.name,
            };
            if (targetBot) {
              setBotMessages((prev) => ({
                ...prev,
                [targetBot.id]: [...updatedMessages, streamingMessage],
              }));
              if (setTargetMessages)
                setTargetMessages([...updatedMessages, streamingMessage]);
            } else {
              setMessages([...updatedMessages, streamingMessage]);
            }
          }
        }

        // Save assistant message to API
        if (currentConversation) {
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: fullResponse,
            timestamp: Date.now(),
            model: currentModel.name,
          };
          messagesApi.create(messageToApiCreatePayload(assistantMessage, currentConversation.id)).catch(console.error);
        }

        if (!targetBot) {
          setTimeout(() => saveCurrentConversation(), 100);
        }
        return { success: true };
      } catch (error) {
        console.error('Error generating response:', error);
        const errorMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: `Error: ${
            error instanceof Error
              ? error.message
              : 'Failed to generate response'
          }`,
          timestamp: Date.now(),
          model: currentModel.name,
        };
        if (targetBot) {
          setBotMessages((prev) => ({
            ...prev,
            [targetBot.id]: [...updatedMessages, errorMessage],
          }));
          if (setTargetMessages)
            setTargetMessages([...updatedMessages, errorMessage]);
        } else {
          setMessages([...updatedMessages, errorMessage]);
        }
        return { success: true };
      } finally {
        setIsLoading(false);
        if (setIsLoadingTarget) setIsLoadingTarget(false);
        setStreamingMessageId(null);
        if (setTargetStreamingId) setTargetStreamingId(null);
      }
    },
    [
      settings.apiKeys,
      selectedModelValue,
      messages,
      systemPrompt,
      trainingExamples,
      parameters,
      botMessages,
      saveCurrentConversation,
      currentConversation,
    ]
  );

  const handleSetComparisonMode = useCallback(
    (enabled: boolean) => {
      setComparisonMode(enabled);
      if (enabled) {
        setComparingBots([currentBotValue, null]);
      } else {
        setComparingBots([null, null]);
      }
    },
    [currentBotValue]
  );

  const value: AppState = useMemo(
    () => ({
      settings,
      updateSettings,
      selectedModel: selectedModelValue,
      setSelectedModel,
      parameters,
      setParameters: updateParameters,
      systemPrompt,
      setSystemPrompt: updateSystemPrompt,
      trainingExamples,
      setTrainingExamples: updateTrainingExamples,
      messages,
      addMessage,
      clearMessages,
      bots,
      currentBot: currentBotValue,
      setCurrentBot,
      createBot,
      updateBot,
      deleteBot,
      reorderBots,
      exportBot,
      exportDefaultAssistant,
      exportAllBots,
      importBots,
      conversations,
      currentConversation,
      createConversation,
      loadConversation,
      saveCurrentConversation,
      deleteConversation,
      isLoading,
      isLoadingBots,
      isLoadingChats,
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      setSidebarCollapsed,
      parameterPanelCollapsed,
      setParameterPanelCollapsed,
      comparisonMode,
      setComparisonMode: handleSetComparisonMode,
      comparingBots,
      setComparingBots,
      getBotMessages,
    }),
    [
      settings,
      updateSettings,
      selectedModelValue,
      setSelectedModel,
      parameters,
      updateParameters,
      systemPrompt,
      updateSystemPrompt,
      trainingExamples,
      updateTrainingExamples,
      messages,
      addMessage,
      clearMessages,
      bots,
      currentBotValue,
      setCurrentBot,
      createBot,
      updateBot,
      deleteBot,
      reorderBots,
      exportBot,
      exportDefaultAssistant,
      exportAllBots,
      importBots,
      conversations,
      currentConversation,
      createConversation,
      loadConversation,
      saveCurrentConversation,
      deleteConversation,
      isLoading,
      isLoadingBots,
      isLoadingChats,
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      parameterPanelCollapsed,
      comparisonMode,
      comparingBots,
      handleSetComparisonMode,
      setComparingBots,
      getBotMessages,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
