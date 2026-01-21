import { useState, useRef } from 'react';
import { useApp, PerformanceProvider } from './contexts';
import { MainLayout, Header, Sidebar } from './components/layout';
import { ChatContainer } from './components/chat';
import { ParameterPanel, ParameterPanelHandle } from './components/config';
import { BotEditorModal } from './components/bots';
import { ComparisonView } from './components/comparison';
import { PerformanceMonitor } from './components/performance';
import { getItem, setItem } from './services/storage';
import type { Bot } from './types';

const PERFORMANCE_MODE_KEY = 'performance-mode';

export function AppContent() {
  const {
    messages,
    systemPrompt,
    setSystemPrompt,
    trainingExamples,
    setTrainingExamples,
    sendMessage,
    isLoading,
    streamingMessageId,
    parameters,
    setParameters,
    parameterPanelCollapsed,
    setParameterPanelCollapsed,
    bots,
    currentBot,
    createBot,
    updateBot,
    deleteBot,
    comparisonMode,
    selectedModel,
    setSelectedModel,
  } = useApp();

  const [botEditorOpen, setBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [performanceMode, setPerformanceModeState] = useState(() =>
    getItem(PERFORMANCE_MODE_KEY, false)
  );
  const parameterPanelRef = useRef<ParameterPanelHandle>(null);

  // Persist performance mode to localStorage
  const setPerformanceMode = (enabled: boolean) => {
    setPerformanceModeState(enabled);
    setItem(PERFORMANCE_MODE_KEY, enabled);
  };

  const handleCreateBot = () => {
    // Create bot directly with default values (no popup)
    createBot();
  };

  const handleEditBot = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (bot) {
      setEditingBot(bot);
      setBotEditorOpen(true);
    }
  };

  const handleSaveBot = (botData: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBot) {
      updateBot(editingBot.id, botData);
    }
  };

  const handleTogglePerformanceMode = () => {
    setPerformanceMode(!performanceMode);
  };

  // Performance mode view
  if (performanceMode) {
    return (
      <PerformanceProvider>
        <PerformanceMonitor onBack={() => setPerformanceMode(false)} />
      </PerformanceProvider>
    );
  }

  return (
    <>
      {comparisonMode ? (
        <ComparisonView />
      ) : (
        <MainLayout
          header={
            <Header
              performanceMode={performanceMode}
              onTogglePerformanceMode={handleTogglePerformanceMode}
            />
          }
          sidebar={
            <Sidebar
              onCreateBot={handleCreateBot}
              onEditBot={handleEditBot}
              onDeleteBot={deleteBot}
            />
          }
          main={
            <ChatContainer
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              streamingMessageId={streamingMessageId}
            />
          }
          panel={
            <ParameterPanel
              ref={parameterPanelRef}
              parameters={parameters}
              onChange={setParameters}
              collapsed={parameterPanelCollapsed}
              onToggleCollapse={() => setParameterPanelCollapsed(!parameterPanelCollapsed)}
              currentBot={currentBot}
              onBotNameChange={(name) => currentBot && updateBot(currentBot.id, { name })}
              onDescriptionChange={(description) => currentBot && updateBot(currentBot.id, { description })}
              systemPrompt={systemPrompt}
              onSystemPromptChange={setSystemPrompt}
              trainingExamples={trainingExamples}
              onTrainingExamplesChange={setTrainingExamples}
              selectedModel={selectedModel.id}
              onModelChange={setSelectedModel}
            />
          }
        />
      )}

      <BotEditorModal
        isOpen={botEditorOpen}
        onClose={() => setBotEditorOpen(false)}
        bot={editingBot}
        onSave={handleSaveBot}
        onDelete={deleteBot}
      />
    </>
  );
}
