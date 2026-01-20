import { useState, useRef } from 'react';
import { useApp } from './contexts';
import { MainLayout, Header, Sidebar } from './components/layout';
import { ChatContainer } from './components/chat';
import { ParameterPanel, ParameterPanelHandle } from './components/config';
import { BotEditorModal } from './components/bots';
import { ComparisonView } from './components/comparison';
import type { Bot } from './types';

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
  const parameterPanelRef = useRef<ParameterPanelHandle>(null);

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

  return (
    <>
      {comparisonMode ? (
        <ComparisonView />
      ) : (
        <MainLayout
          header={<Header />}
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
