import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../contexts';
import { useUserId } from '../../contexts/useUser';
import { ParameterPanel } from '../config';
import { ChatInput } from '../chat/ChatInput';
import { ComparisonChatSection } from './ComparisonChatSection';
import { DEFAULT_PARAMETERS } from '../../types/parameters';
import { MODELS } from '../../constants/models';
import {
  chatsApi,
  messagesApi,
  apiChatToConversation,
  conversationToApiChatCreatePayload,
  apiMessageToApp,
} from '../../services/api';
import type { Bot, Message, GenerationParameters, TrainingExample, Conversation } from '../../types';
import './ComparisonView.css';

export function ComparisonView() {
  const userId = useUserId();
  const {
    bots,
    comparingBots,
    setComparingBots,
    updateBot,
    setComparisonMode,
    conversations,
  } = useApp();

  // Database conversations for each panel
  const [conversation1, setConversation1] = useState<Conversation | null>(null);
  const [conversation2, setConversation2] = useState<Conversation | null>(null);

  // Messages loaded from database
  const [bot1Messages, setBot1Messages] = useState<Message[]>([]);
  const [bot2Messages, setBot2Messages] = useState<Message[]>([]);

  // Loading and streaming states
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [streamingId1] = useState<string | null>(null);
  const [streamingId2] = useState<string | null>(null);

  // Selected bot IDs
  const [selectedBot1, setSelectedBot1] = useState<string>(comparingBots[0]?.id || '');
  const [selectedBot2, setSelectedBot2] = useState<string>(comparingBots[1]?.id || '');

  // Collapse states for UI sections
  const [parameters1Collapsed, setParameters1Collapsed] = useState(true);
  const [systemPrompt1Collapsed, setSystemPrompt1Collapsed] = useState(true);
  const [examples1Collapsed, setExamples1Collapsed] = useState(true);
  const [chat1Collapsed, setChat1Collapsed] = useState(false);

  const [parameters2Collapsed, setParameters2Collapsed] = useState(true);
  const [systemPrompt2Collapsed, setSystemPrompt2Collapsed] = useState(true);
  const [examples2Collapsed, setExamples2Collapsed] = useState(true);
  const [chat2Collapsed, setChat2Collapsed] = useState(false);

  // Helper to update state for a specific panel index
  const updatePanelState = useCallback((
    index: 0 | 1,
    conversation: Conversation | null,
    messages: Message[]
  ) => {
    if (index === 0) {
      setConversation1(conversation);
      setBot1Messages(messages);
    } else {
      setConversation2(conversation);
      setBot2Messages(messages);
    }
  }, []);

  // Load conversation and messages for a bot from the database
  const loadBotConversation = useCallback(async (bot: Bot | null, index: 0 | 1) => {
    if (!bot) {
      updatePanelState(index, null, []);
      return;
    }

    // Find existing conversation for this bot from global conversations
    const botConversations = conversations.filter(c => c.botId === bot.id);
    const mostRecentConversation = botConversations.length > 0
      ? [...botConversations].sort((a, b) => b.createdAt - a.createdAt)[0]
      : null;

    if (!mostRecentConversation) {
      // No existing conversation - will create one when sending first message
      updatePanelState(index, null, []);
      return;
    }

    // Load messages from API
    try {
      const apiMessages = await messagesApi.list(mostRecentConversation.id);
      const loadedMessages = apiMessages.map(apiMessageToApp);
      updatePanelState(index, mostRecentConversation, loadedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      updatePanelState(index, mostRecentConversation, []);
    }
  }, [conversations, updatePanelState]);

  // Load conversations when comparing bots change
  useEffect(() => {
    const bot1Id = comparingBots[0]?.id || '';
    const bot2Id = comparingBots[1]?.id || '';
    setSelectedBot1(bot1Id);
    setSelectedBot2(bot2Id);

    // Load existing conversations for the bots
    if (comparingBots[0]) {
      loadBotConversation(comparingBots[0], 0);
    } else {
      setConversation1(null);
      setBot1Messages([]);
    }
    if (comparingBots[1]) {
      loadBotConversation(comparingBots[1], 1);
    } else {
      setConversation2(null);
      setBot2Messages([]);
    }
  }, [comparingBots, loadBotConversation]);

  const getBotParams = (bot: Bot | null) => {
    return bot?.defaultParameters || DEFAULT_PARAMETERS;
  };

  const getBotSystemPrompt = (bot: Bot | null) => {
    return bot?.systemPrompt || '';
  };

  const getBotExamples = (bot: Bot | null): TrainingExample[] => {
    return bot?.trainingExamples || [];
  };

  const getBotModel = (bot: Bot | null): string => {
    return bot?.preferredModel || MODELS[0].id;
  };

  const handleModelChange = (index: 0 | 1, modelId: string) => {
    const bot = comparingBots[index];
    if (bot) {
      updateBot(bot.id, { preferredModel: modelId });
      const updatedBots: [Bot | null, Bot | null] = [...comparingBots];
      updatedBots[index] = { ...bot, preferredModel: modelId };
      setComparingBots(updatedBots);
    }
  };

  const handleParametersToggle = (index: 0 | 1) => {
    if (index === 0) {
      const newState = !parameters1Collapsed;
      setParameters1Collapsed(newState);
      if (!newState) {
        setSystemPrompt1Collapsed(true);
        setExamples1Collapsed(true);
        setChat1Collapsed(true);
      }
    } else {
      const newState = !parameters2Collapsed;
      setParameters2Collapsed(newState);
      if (!newState) {
        setSystemPrompt2Collapsed(true);
        setExamples2Collapsed(true);
        setChat2Collapsed(true);
      }
    }
  };

  const handleSystemPromptToggle = (index: 0 | 1) => {
    if (index === 0) {
      const newState = !systemPrompt1Collapsed;
      setSystemPrompt1Collapsed(newState);
      if (!newState) {
        setParameters1Collapsed(true);
        setExamples1Collapsed(true);
        setChat1Collapsed(true);
      }
    } else {
      const newState = !systemPrompt2Collapsed;
      setSystemPrompt2Collapsed(newState);
      if (!newState) {
        setParameters2Collapsed(true);
        setExamples2Collapsed(true);
        setChat2Collapsed(true);
      }
    }
  };

  const handleExamplesToggle = (index: 0 | 1) => {
    if (index === 0) {
      const newState = !examples1Collapsed;
      setExamples1Collapsed(newState);
      if (!newState) {
        setParameters1Collapsed(true);
        setSystemPrompt1Collapsed(true);
        setChat1Collapsed(true);
      }
    } else {
      const newState = !examples2Collapsed;
      setExamples2Collapsed(newState);
      if (!newState) {
        setParameters2Collapsed(true);
        setSystemPrompt2Collapsed(true);
        setChat2Collapsed(true);
      }
    }
  };

  const handleChatToggle = (index: 0 | 1) => {
    if (index === 0) {
      const newState = !chat1Collapsed;
      setChat1Collapsed(newState);
      if (!newState) {
        setParameters1Collapsed(true);
        setSystemPrompt1Collapsed(true);
        setExamples1Collapsed(true);
      }
    } else {
      const newState = !chat2Collapsed;
      setChat2Collapsed(newState);
      if (!newState) {
        setParameters2Collapsed(true);
        setSystemPrompt2Collapsed(true);
        setExamples2Collapsed(true);
      }
    }
  };

  const handleSelectBot = async (index: 0 | 1, botId: string) => {
    const newBots: [Bot | null, Bot | null] = [...comparingBots];

    // Find the bot by ID, or set to null if empty selection
    const botToSet = botId === '' ? null : bots.find((b) => b.id === botId) || null;

    newBots[index] = botToSet;
    setComparingBots(newBots);

    if (index === 0) {
      setSelectedBot1(botId);
    } else {
      setSelectedBot2(botId);
    }

    // Load conversation from database
    await loadBotConversation(botToSet, index);
  };

  const handleParametersChange = (index: 0 | 1, params: GenerationParameters) => {
    const bot = comparingBots[index];
    if (bot) {
      updateBot(bot.id, { defaultParameters: params });
      const updatedBots: [Bot | null, Bot | null] = [...comparingBots];
      updatedBots[index] = { ...bot, defaultParameters: params };
      setComparingBots(updatedBots);
    }
  };

  const handleSystemPromptChange = (index: 0 | 1, prompt: string) => {
    const bot = comparingBots[index];
    if (bot) {
      updateBot(bot.id, { systemPrompt: prompt });
      const updatedBots: [Bot | null, Bot | null] = [...comparingBots];
      updatedBots[index] = { ...bot, systemPrompt: prompt };
      setComparingBots(updatedBots);
    }
  };

  const handleExamplesChange = (index: 0 | 1, examples: TrainingExample[]) => {
    const bot = comparingBots[index];
    if (bot) {
      updateBot(bot.id, { trainingExamples: examples });
      const updatedBots: [Bot | null, Bot | null] = [...comparingBots];
      updatedBots[index] = { ...bot, trainingExamples: examples };
      setComparingBots(updatedBots);
    }
  };

  const handleDescriptionChange = (index: 0 | 1, description: string) => {
    const bot = comparingBots[index];
    if (bot) {
      updateBot(bot.id, { description });
      const updatedBots: [Bot | null, Bot | null] = [...comparingBots];
      updatedBots[index] = { ...bot, description };
      setComparingBots(updatedBots);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!comparingBots[0] && !comparingBots[1]) return;
    if (!userId) return;

    const sendToBot = async (
      bot: Bot | null,
      currentMessages: Message[],
      setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
      currentConversation: Conversation | null,
      setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>,
      setIsLoading: (loading: boolean) => void
    ) => {
      if (!bot) return;

      setIsLoading(true);

      try {
        // Create or get conversation - chatId is required for the backend
        let conversationToUse = currentConversation;
        if (!conversationToUse) {
          // Create a new conversation in the database
          const conversationData = {
            title: content.slice(0, 50),
            botId: bot.id,
          };
          const apiChat = await chatsApi.create(conversationToApiChatCreatePayload(conversationData, userId));
          conversationToUse = apiChatToConversation(apiChat);
          setConversation(conversationToUse);
        }

        // Create user message for local state
        const userMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        // Update local state with user message
        const updatedMessages = [...currentMessages, userMessage];
        setMessages(updatedMessages);

        // Send message to backend - backend handles:
        // - Calling Gemini API
        // - Saving user message to database
        // - Saving AI response to database
        const response = await chatsApi.send({
          message: content,
          agentId: bot.id,
          chatId: conversationToUse.id,
        });

        // Create assistant message for local state
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.response,
          timestamp: Date.now(),
        };

        // Update local state with assistant message
        setMessages([...updatedMessages, assistantMessage]);
      } catch (error) {
        console.error('Error generating response:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    await Promise.all([
      sendToBot(comparingBots[0], bot1Messages, setBot1Messages, conversation1, setConversation1, setIsLoading1),
      sendToBot(comparingBots[1], bot2Messages, setBot2Messages, conversation2, setConversation2, setIsLoading2),
    ]);
  };

  const handleBack = () => {
    setComparisonMode(false);
  };

  // Delete message from database and local state
  const handleDeleteMessage1 = async (id: string) => {
    setBot1Messages(prev => prev.filter(msg => msg.id !== id));
    try {
      await messagesApi.delete(id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleDeleteMessage2 = async (id: string) => {
    setBot2Messages(prev => prev.filter(msg => msg.id !== id));
    try {
      await messagesApi.delete(id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <div className="ai-studio-comparison-view">
      <header className="ai-studio-comparison-header">
        <div className="ai-studio-comparison-header-left">
          <button className="ai-studio-back-btn" onClick={handleBack} title="Exit comparison">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ai-studio-comparison-title">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 4.375H7.5C5.77411 4.375 4.375 5.77411 4.375 7.5V12.5C4.375 14.2259 5.77411 15.625 7.5 15.625H12.5C14.2259 15.625 15.625 14.2259 15.625 12.5V7.5C15.625 5.77411 14.2259 4.375 12.5 4.375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 4.375V2.5C7.5 1.80964 8.05964 1.25 8.75 1.25H11.25C11.9404 1.25 12.5 1.80964 12.5 2.5V4.375M15.625 7.5H17.5C18.1904 7.5 18.75 8.05964 18.75 8.75V11.25C18.75 11.9404 18.1904 12.5 17.5 12.5H15.625M4.375 7.5H2.5C1.80964 7.5 1.25 8.05964 1.25 8.75V11.25C1.25 11.9404 1.80964 12.5 2.5 12.5H4.375M12.5 15.625V17.5C12.5 18.1904 11.9404 18.75 11.25 18.75H8.75C8.05964 18.75 7.5 18.1904 7.5 17.5V15.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Comparison Mode</span>
          </div>
        </div>
      </header>
      <div className="ai-studio-comparison-panels">
        <div className="ai-studio-comparison-panel">
          <div className="ai-studio-comparison-panel-header">
            <select
              id="bot-selector-1"
              name="bot-selector-1"
              className="ai-studio-bot-selector"
              value={selectedBot1}
              onChange={(e) => handleSelectBot(0, e.target.value)}
            >
              <option value="">Select Bot 1</option>
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ai-studio-comparison-panel-content">
            {selectedBot1 === '' ? (
              <div className="ai-studio-comparison-empty">
                <p>Select a bot to compare</p>
              </div>
            ) : (
              <>
                <div className={`ai-studio-comparison-config ${parameters1Collapsed && systemPrompt1Collapsed && examples1Collapsed ? '' : 'has-expanded'}`}>
                  <ParameterPanel
                    parameters={getBotParams(comparingBots[0])}
                    onChange={(params) => handleParametersChange(0, params)}
                    collapsed={false}
                    parametersCollapsedProp={parameters1Collapsed}
                    onParametersToggle={() => handleParametersToggle(0)}
                    systemPromptCollapsedProp={systemPrompt1Collapsed}
                    onSystemPromptToggle={() => handleSystemPromptToggle(0)}
                    examplesCollapsedProp={examples1Collapsed}
                    onExamplesToggle={() => handleExamplesToggle(0)}
                    currentBot={comparingBots[0]}
                    onDescriptionChange={(description) => handleDescriptionChange(0, description)}
                    systemPrompt={getBotSystemPrompt(comparingBots[0])}
                    onSystemPromptChange={(prompt) => handleSystemPromptChange(0, prompt)}
                    trainingExamples={getBotExamples(comparingBots[0])}
                    onTrainingExamplesChange={(examples) => handleExamplesChange(0, examples)}
                    hideBotName={true}
                    selectedModel={getBotModel(comparingBots[0])}
                    onModelChange={(modelId) => handleModelChange(0, modelId)}
                  />
                </div>
                <div className={`ai-studio-comparison-chat-section-wrapper ${chat1Collapsed ? '' : 'expanded'}`}>
                  <ComparisonChatSection
                    messages={bot1Messages}
                    isLoading={isLoading1}
                    streamingMessageId={streamingId1}
                    collapsed={chat1Collapsed}
                    onToggleCollapse={() => handleChatToggle(0)}
                    onDeleteMessage={handleDeleteMessage1}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="ai-studio-comparison-panel">
          <div className="ai-studio-comparison-panel-header">
            <select
              id="bot-selector-2"
              name="bot-selector-2"
              className="ai-studio-bot-selector"
              value={selectedBot2}
              onChange={(e) => handleSelectBot(1, e.target.value)}
            >
              <option value="">Select Bot 2</option>
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ai-studio-comparison-panel-content">
            {selectedBot2 === '' ? (
              <div className="ai-studio-comparison-empty">
                <p>Select a bot to compare</p>
              </div>
            ) : (
              <>
                <div className={`ai-studio-comparison-config ${parameters2Collapsed && systemPrompt2Collapsed && examples2Collapsed ? '' : 'has-expanded'}`}>
                  <ParameterPanel
                    parameters={getBotParams(comparingBots[1])}
                    onChange={(params) => handleParametersChange(1, params)}
                    collapsed={false}
                    parametersCollapsedProp={parameters2Collapsed}
                    onParametersToggle={() => handleParametersToggle(1)}
                    systemPromptCollapsedProp={systemPrompt2Collapsed}
                    onSystemPromptToggle={() => handleSystemPromptToggle(1)}
                    examplesCollapsedProp={examples2Collapsed}
                    onExamplesToggle={() => handleExamplesToggle(1)}
                    currentBot={comparingBots[1]}
                    onDescriptionChange={(description) => handleDescriptionChange(1, description)}
                    systemPrompt={getBotSystemPrompt(comparingBots[1])}
                    onSystemPromptChange={(prompt) => handleSystemPromptChange(1, prompt)}
                    trainingExamples={getBotExamples(comparingBots[1])}
                    onTrainingExamplesChange={(examples) => handleExamplesChange(1, examples)}
                    hideBotName={true}
                    selectedModel={getBotModel(comparingBots[1])}
                    onModelChange={(modelId) => handleModelChange(1, modelId)}
                  />
                </div>
                <div className={`ai-studio-comparison-chat-section-wrapper ${chat2Collapsed ? '' : 'expanded'}`}>
                  <ComparisonChatSection
                    messages={bot2Messages}
                    isLoading={isLoading2}
                    streamingMessageId={streamingId2}
                    collapsed={chat2Collapsed}
                    onToggleCollapse={() => handleChatToggle(1)}
                    onDeleteMessage={handleDeleteMessage2}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ai-studio-comparison-input">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading1 || isLoading2 || (!comparingBots[0] && !comparingBots[1])}
          placeholder="Write a prompt to compare..."
        />
      </div>
    </div>
  );
}
