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
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() =>
    getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  // Model selection - check for saved bot's preferred model first
  const [selectedModelValue, setSelectedModelValue] = useState<ModelConfig>(
    () => {
      // Check if there's a saved bot with a preferred model
      const savedBotId = getItem<string | null>(STORAGE_KEYS.CURRENT_BOT, null);
      if (savedBotId) {
        const savedBots = getItem<Bot[]>(STORAGE_KEYS.BOTS, []);
        const savedBot = savedBots.find(b => b.id === savedBotId);
        if (savedBot?.preferredModel) {
          const botModel = getModelById(savedBot.preferredModel);
          if (botModel) return botModel;
        }
      }
      // Fall back to default model from settings
      const saved = settings.defaultModel;
      return getModelById(saved) || MODELS[0];
    }
  );

  // Bots - initialize first so we can use saved bot for other state
  const [bots, setBots] = useState<Bot[]>(() => getItem(STORAGE_KEYS.BOTS, []));
  const [currentBotValue, setCurrentBotValue] = useState<Bot | null>(() => {
    const savedBotId = getItem<string | null>(STORAGE_KEYS.CURRENT_BOT, null);
    if (savedBotId) {
      const savedBots = getItem<Bot[]>(STORAGE_KEYS.BOTS, []);
      return savedBots.find(b => b.id === savedBotId) || null;
    }
    return null;
  });

  // Get initial bot for state initialization
  const getInitialBot = (): Bot | null => {
    const savedBotId = getItem<string | null>(STORAGE_KEYS.CURRENT_BOT, null);
    if (savedBotId) {
      const savedBots = getItem<Bot[]>(STORAGE_KEYS.BOTS, []);
      return savedBots.find(b => b.id === savedBotId) || null;
    }
    return null;
  };

  // Parameters - initialize from saved bot if available
  const [parameters, setParameters] = useState<GenerationParameters>(() => {
    const initialBot = getInitialBot();
    return initialBot?.defaultParameters || DEFAULT_PARAMETERS;
  });

  // System prompt - initialize from saved bot if available
  const [systemPrompt, setSystemPrompt] = useState(() => {
    const initialBot = getInitialBot();
    return initialBot?.systemPrompt || '';
  });

  // Training examples - initialize from saved bot if available
  const [trainingExamples, setTrainingExamplesState] = useState<TrainingExample[]>(() => {
    const initialBot = getInitialBot();
    return initialBot?.trainingExamples || [];
  });

  // Messages - initialize from saved bot messages if available
  const [botMessages, setBotMessages] = useState<Record<string, Message[]>>(
    () => getItem(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', {})
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedBotId = getItem<string | null>(STORAGE_KEYS.CURRENT_BOT, null);
    if (savedBotId) {
      const savedBotMessages = getItem<Record<string, Message[]>>(STORAGE_KEYS.CONVERSATIONS + '_bot_messages', {});
      return savedBotMessages[savedBotId] || [];
    }
    return [];
  });

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
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparingBots, setComparingBots] = useState<[Bot | null, Bot | null]>([
    null,
    null,
  ]);

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

  // Persist current bot selection
  useEffect(() => {
    setItem(STORAGE_KEYS.CURRENT_BOT, currentBotValue?.id || null);
  }, [currentBotValue]);

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

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
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
        setTrainingExamplesState(bot.trainingExamples || []);
        if (bot.preferredModel) {
          setSelectedModel(bot.preferredModel);
        }
      } else {
        setSystemPrompt('');
        setParameters(DEFAULT_PARAMETERS);
        setTrainingExamplesState([]);
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
          trainingExamples: botData?.trainingExamples ?? [],
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

  const updateTrainingExamples = useCallback(
    (examples: TrainingExample[]) => {
      setTrainingExamplesState(examples);
      if (currentBotValue) {
        setBots((prev) =>
          prev.map((bot) =>
            bot.id === currentBotValue.id
              ? { ...bot, trainingExamples: examples, updatedAt: Date.now() }
              : bot
          )
        );
        setCurrentBotValue((prev) =>
          prev ? { ...prev, trainingExamples: examples, updatedAt: Date.now() } : null
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

  const reorderBots = useCallback((fromIndex: number, toIndex: number) => {
    setBots((prev) => {
      const newBots = [...prev];
      const [removed] = newBots.splice(fromIndex, 1);
      newBots.splice(toIndex, 0, removed);
      return newBots;
    });
  }, []);

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
        trainingExamples: bot.trainingExamples || [],
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

        // Combine system prompt with training examples
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
        return { success: true }; // Error shown in chat, so still "success" for clearing input
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
      trainingExamples,
      setTrainingExamples: updateTrainingExamples,
      messages,
      addMessage,
      updateMessage,
      deleteMessage,
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
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      setSidebarCollapsed,
      parameterPanelCollapsed,
      setParameterPanelCollapsed,
      comparisonMode,
      setComparisonMode,
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
      updateMessage,
      deleteMessage,
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
      streamingMessageId,
      sendMessage,
      sidebarCollapsed,
      parameterPanelCollapsed,
      comparisonMode,
      comparingBots,
      setComparisonMode,
      setComparingBots,
      getBotMessages,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
