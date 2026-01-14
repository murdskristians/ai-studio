import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Bot,
  Conversation,
  Message,
  GenerationParameters,
  ModelConfig,
  AppSettings,
} from '../types';
import { DEFAULT_PARAMETERS } from '../types/parameters';
import { DEFAULT_SETTINGS } from '../types/settings';
import { getItem, setItem, STORAGE_KEYS } from '../services/storage';
import { createProvider } from '../services/providers';
import { MODELS, getModelById } from '../constants/models';
import { AppContext, type AppState } from './AppContextDef';

interface AppProviderProps {
  readonly children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() =>
    getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  // Model selection
  const [selectedModelValue, setSelectedModelValue] = useState<ModelConfig>(
    () => {
      const saved = settings.defaultModel;
      return getModelById(saved) || MODELS[0];
    }
  );

  // Parameters
  const [parameters, setParameters] =
    useState<GenerationParameters>(DEFAULT_PARAMETERS);

  // System prompt
  const [systemPrompt, setSystemPrompt] = useState('');

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [botMessages, setBotMessages] = useState<Record<string, Message[]>>(
    () => getItem(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', {})
  );

  // Bots
  const [bots, setBots] = useState<Bot[]>(() => getItem(STORAGE_KEYS.BOTS, []));
  const [currentBotValue, setCurrentBotValue] = useState<Bot | null>(null);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getItem(STORAGE_KEYS.CONVERSATIONS, [])
  );
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    settings.sidebarCollapsed
  );
  const [parameterPanelCollapsed, setParameterPanelCollapsed] = useState(
    settings.parameterPanelCollapsed
  );

  // Persist settings
  useEffect(() => {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Persist bots
  useEffect(() => {
    setItem(STORAGE_KEYS.BOTS, bots);
  }, [bots]);

  // Persist conversations
  useEffect(() => {
    setItem(STORAGE_KEYS.CONVERSATIONS, conversations);
  }, [conversations]);

  // Persist bot messages
  useEffect(() => {
    setItem(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', botMessages);
  }, [botMessages]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setSelectedModel = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModelValue(model);
    }
  }, []);

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

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg))
    );
  }, []);

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
        if (bot.preferredModel) {
          setSelectedModel(bot.preferredModel);
        }
      } else {
        setSystemPrompt('');
        setParameters(DEFAULT_PARAMETERS);
      }
    },
    [setSelectedModel, currentBotValue?.id, messages, botMessages]
  );

  const createBot = useCallback(
    (botData?: Partial<Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>>): Bot => {
      let newBot: Bot = null!;

      setBots((currentBots) => {
        let botName = botData?.name;
        if (!botName) {
          const baseName = 'Default Assistant';
          const existingNames = new Set(currentBots.map((b) => b.name));
          existingNames.add(baseName);

          let counter = 2;
          while (existingNames.has(`${baseName} ${counter}`)) {
            counter++;
          }
          botName = `${baseName} ${counter}`;
        }

        newBot = {
          name: botName,
          description: botData?.description ?? '',
          systemPrompt: botData?.systemPrompt ?? '',
          preferredModel: botData?.preferredModel,
          preferredProvider: botData?.preferredProvider,
          defaultParameters: botData?.defaultParameters ?? {
            ...DEFAULT_PARAMETERS,
          },
          id: uuidv4(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return [...currentBots, newBot];
      });

      return newBot;
    },
    []
  );

  const updateBot = useCallback(
    (id: string, updates: Partial<Bot>) => {
      setBots((prev) =>
        prev.map((bot) =>
          bot.id === id ? { ...bot, ...updates, updatedAt: Date.now() } : bot
        )
      );
      if (currentBotValue?.id === id) {
        setCurrentBotValue((prev) =>
          prev ? { ...prev, ...updates, updatedAt: Date.now() } : null
        );
      }
    },
    [currentBotValue?.id]
  );

  const updateSystemPrompt = useCallback(
    (prompt: string) => {
      setSystemPrompt(prompt);
      if (currentBotValue) {
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id
              ? { ...bot, systemPrompt: prompt, updatedAt: Date.now() }
              : bot
          )
        );
        setCurrentBotValue((prev) =>
          prev ? { ...prev, systemPrompt: prompt, updatedAt: Date.now() } : null
        );
      }
    },
    [currentBotValue]
  );

  const updateParameters = useCallback(
    (params: GenerationParameters) => {
      setParameters(params);
      if (currentBotValue) {
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id
              ? { ...bot, defaultParameters: params, updatedAt: Date.now() }
              : bot
          )
        );
        setCurrentBotValue((prev) =>
          prev
            ? { ...prev, defaultParameters: params, updatedAt: Date.now() }
            : null
        );
      }
    },
    [currentBotValue]
  );

  const deleteBot = useCallback(
    (id: string) => {
      setBots((prev) => prev.filter((bot) => bot.id !== id));
      if (currentBotValue?.id === id) {
        setCurrentBotValue(null);
      }
    },
    [currentBotValue]
  );

  const exportBot = useCallback(
    (id: string) => {
      const bot = bots.find((b) => b.id === id);
      if (!bot) return;

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        bots: [bot],
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
    [bots]
  );

  const exportDefaultAssistant = useCallback(() => {
    const defaultBot = {
      name: 'Default Assistant',
      description: '',
      systemPrompt: '',
      defaultParameters: { ...DEFAULT_PARAMETERS },
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
  }, []);

  const exportAllBots = useCallback(() => {
    if (bots.length === 0) return;

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bots,
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
  }, [bots]);

  const importBots = useCallback(async (file: File): Promise<number> => {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.bots || !Array.isArray(data.bots)) {
      throw new Error('Invalid bot file format');
    }

    let importedCount = 0;
    const newBots: Bot[] = [];

    for (const bot of data.bots) {
      // Validate required fields
      if (!bot.name || !bot.defaultParameters) {
        continue;
      }

      // Create new bot with new ID to avoid conflicts
      const newBot: Bot = {
        id: uuidv4(),
        name: bot.name,
        description: bot.description || '',
        systemPrompt: bot.systemPrompt || '',
        preferredModel: bot.preferredModel,
        preferredProvider: bot.preferredProvider,
        defaultParameters: {
          temperature: bot.defaultParameters.temperature ?? 1,
          topP: bot.defaultParameters.topP ?? 0.95,
          maxTokens: bot.defaultParameters.maxTokens ?? 65535,
          stopSequences: bot.defaultParameters.stopSequences || [],
          thinkingMode: bot.defaultParameters.thinkingMode ?? false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      newBots.push(newBot);
      importedCount++;
    }

    if (newBots.length > 0) {
      setBots((prev) => [...prev, ...newBots]);
    }

    return importedCount;
  }, []);

  const createConversation = useCallback((): Conversation => {
    const conversation: Conversation = {
      id: uuidv4(),
      title: 'New conversation',
      botId: currentBotValue?.id,
      modelId: selectedModelValue.id,
      providerId: selectedModelValue.provider,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conversation, ...prev]);
    setCurrentConversation(conversation);
    setMessages([]);
    return conversation;
  }, [currentBotValue, selectedModelValue]);

  const loadConversation = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
        setMessages(conversation.messages);
        setSelectedModel(conversation.modelId);
        if (conversation.botId) {
          const bot = bots.find((b) => b.id === conversation.botId);
          if (bot) {
            setCurrentBotValue(bot);
            setSystemPrompt(bot.systemPrompt);
            setParameters(bot.defaultParameters);
          }
        }
      }
    },
    [conversations, bots, setSelectedModel]
  );

  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return;

    const title = messages[0]?.content.slice(0, 50) || 'New conversation';

    if (currentConversation) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation.id
            ? { ...c, messages, title, updatedAt: Date.now() }
            : c
        )
      );
    } else {
      const conversation: Conversation = {
        id: uuidv4(),
        title,
        botId: currentBotValue?.id,
        modelId: selectedModelValue.id,
        providerId: selectedModelValue.provider,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversation(conversation);
    }
  }, [messages, currentConversation, currentBotValue, selectedModelValue]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    },
    [currentConversation]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const providerKey = selectedModelValue.provider;
      const apiKey = settings.apiKeys[providerKey];
      if (!apiKey) {
        alert(
          `Please configure your ${selectedModelValue.provider} API key in settings.`
        );
        return;
      }

      const userMessage = addMessage({ role: 'user', content });

      const assistantMessage = addMessage({
        role: 'assistant',
        content: '',
        model: selectedModelValue.name,
      });

      setIsLoading(true);
      setStreamingMessageId(assistantMessage.id);

      try {
        const provider = createProvider(selectedModelValue.provider, apiKey);

        const messagesForApi = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const stream = provider.generateStream({
          model: selectedModelValue.id,
          messages: messagesForApi,
          systemPrompt: systemPrompt || undefined,
          parameters,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          if (chunk.text) {
            fullResponse += chunk.text;
            updateMessage(assistantMessage.id, fullResponse);
          }
        }

        setTimeout(() => saveCurrentConversation(), 100);
      } catch (error) {
        console.error('Error generating response:', error);
        updateMessage(
          assistantMessage.id,
          `Error: ${
            error instanceof Error
              ? error.message
              : 'Failed to generate response'
          }`
        );
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    },
    [
      settings.apiKeys,
      selectedModelValue,
      messages,
      systemPrompt,
      parameters,
      addMessage,
      updateMessage,
      saveCurrentConversation,
    ]
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
      messages,
      addMessage,
      updateMessage,
      clearMessages,
      bots,
      currentBot: currentBotValue,
      setCurrentBot,
      createBot,
      updateBot,
      deleteBot,
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
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      setSidebarCollapsed,
      parameterPanelCollapsed,
      setParameterPanelCollapsed,
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
      messages,
      addMessage,
      updateMessage,
      clearMessages,
      bots,
      currentBotValue,
      setCurrentBot,
      createBot,
      updateBot,
      deleteBot,
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
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      parameterPanelCollapsed,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
