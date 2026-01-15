import { useState, useEffect } from 'react';
import { useApp } from '../../contexts';
import { ParameterPanel } from '../config';
import { ChatInput } from '../chat/ChatInput';
import { ComparisonChatSection } from './ComparisonChatSection';
import { DEFAULT_PARAMETERS } from '../../types/parameters';
import type { Bot, Message, GenerationParameters, TrainingExample } from '../../types';
import './ComparisonView.css';

export function ComparisonView() {
  const {
    bots,
    comparingBots,
    setComparingBots,
    setCurrentBot,
    sendMessage,
    updateBot,
    setComparisonMode,
  } = useApp();

  const [bot1Messages, setBot1Messages] = useState<Message[]>([]);
  const [bot2Messages, setBot2Messages] = useState<Message[]>([]);
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [streamingId1, setStreamingId1] = useState<string | null>(null);
  const [streamingId2, setStreamingId2] = useState<string | null>(null);
  const [selectedBot1, setSelectedBot1] = useState<string>(comparingBots[0]?.id || 'default');
  const [selectedBot2, setSelectedBot2] = useState<string>(comparingBots[1]?.id || 'default');

  const [parameters1Collapsed, setParameters1Collapsed] = useState(true);
  const [systemPrompt1Collapsed, setSystemPrompt1Collapsed] = useState(true);
  const [examples1Collapsed, setExamples1Collapsed] = useState(true);
  const [chat1Collapsed, setChat1Collapsed] = useState(false);

  const [parameters2Collapsed, setParameters2Collapsed] = useState(true);
  const [systemPrompt2Collapsed, setSystemPrompt2Collapsed] = useState(true);
  const [examples2Collapsed, setExamples2Collapsed] = useState(true);
  const [chat2Collapsed, setChat2Collapsed] = useState(false);

  useEffect(() => {
    setSelectedBot1(comparingBots[0]?.id || 'default');
    setSelectedBot2(comparingBots[1]?.id || 'default');
  }, [comparingBots]);

  const getBotParams = (bot: Bot | null) => {
    return bot?.defaultParameters || DEFAULT_PARAMETERS;
  };

  const getBotSystemPrompt = (bot: Bot | null) => {
    return bot?.systemPrompt || '';
  };

  const getBotExamples = (bot: Bot | null): TrainingExample[] => {
    return bot?.trainingExamples || [];
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

  const handleSelectBot = (index: 0 | 1, botId: string) => {
    const newBots: [Bot | null, Bot | null] = [...comparingBots];

    let botToSet: Bot | null = null;
    if (botId === 'default') {
      botToSet = null;
    } else if (botId !== '') {
      botToSet = bots.find((b) => b.id === botId) || null;
    }

    newBots[index] = botToSet;
    setComparingBots(newBots);

    if (index === 0) {
      setSelectedBot1(botId);
      setBot1Messages([]);
    } else {
      setSelectedBot2(botId);
      setBot2Messages([]);
    }
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

  const handleSendMessage = async (content: string) => {
    if (!comparingBots[0] && !comparingBots[1]) return;

    const sendToBot = async (
      bot: Bot | null,
      index: 0 | 1,
      messages: Message[],
      setMessages: (msgs: Message[]) => void,
      setIsLoading: (loading: boolean) => void,
      setStreamingId: (id: string | null) => void
    ) => {
      if (!bot) return;

      setIsLoading(true);
      try {
        setCurrentBot(bot);
        await sendMessage(content, bot, setMessages, setStreamingId, setIsLoading);
      } finally {
        setIsLoading(false);
      }
    };

    await Promise.all([
      sendToBot(comparingBots[0], 0, bot1Messages, setBot1Messages, setIsLoading1, setStreamingId1),
      sendToBot(comparingBots[1], 1, bot2Messages, setBot2Messages, setIsLoading2, setStreamingId2),
    ]);
  };

  const handleBack = () => {
    setComparisonMode(false);
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
              <option value="default">Default Assistant</option>
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
                <div className={`ai-studio-comparison-config ${!parameters1Collapsed || !systemPrompt1Collapsed || !examples1Collapsed ? 'has-expanded' : ''}`}>
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
                    systemPrompt={getBotSystemPrompt(comparingBots[0])}
                    onSystemPromptChange={(prompt) => handleSystemPromptChange(0, prompt)}
                    trainingExamples={getBotExamples(comparingBots[0])}
                    onTrainingExamplesChange={(examples) => handleExamplesChange(0, examples)}
                    hideBotName={true}
                  />
                </div>
                <div className={`ai-studio-comparison-chat-section-wrapper ${!chat1Collapsed ? 'expanded' : ''}`}>
                  <ComparisonChatSection
                    messages={bot1Messages}
                    isLoading={isLoading1}
                    streamingMessageId={streamingId1}
                    collapsed={chat1Collapsed}
                    onToggleCollapse={() => handleChatToggle(0)}
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
              <option value="default">Default Assistant</option>
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
                <div className={`ai-studio-comparison-config ${!parameters2Collapsed || !systemPrompt2Collapsed || !examples2Collapsed ? 'has-expanded' : ''}`}>
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
                    systemPrompt={getBotSystemPrompt(comparingBots[1])}
                    onSystemPromptChange={(prompt) => handleSystemPromptChange(1, prompt)}
                    trainingExamples={getBotExamples(comparingBots[1])}
                    onTrainingExamplesChange={(examples) => handleExamplesChange(1, examples)}
                    hideBotName={true}
                  />
                </div>
                <div className={`ai-studio-comparison-chat-section-wrapper ${!chat2Collapsed ? 'expanded' : ''}`}>
                  <ComparisonChatSection
                    messages={bot2Messages}
                    isLoading={isLoading2}
                    streamingMessageId={streamingId2}
                    collapsed={chat2Collapsed}
                    onToggleCollapse={() => handleChatToggle(1)}
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
