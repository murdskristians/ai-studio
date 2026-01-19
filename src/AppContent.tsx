import { useState, useRef } from 'react';
import { useApp } from './contexts';
import { MainLayout, Header, Sidebar, SettingsModal } from './components/layout';
import { ChatContainer } from './components/chat';
import { ParameterPanel, ParameterPanelHandle } from './components/config';
import { BotEditorModal } from './components/bots';
import { ComparisonView } from './components/comparison';
import { Modal, Button } from './components/ui';
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [botEditorOpen, setBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [apiKeyErrorProvider, setApiKeyErrorProvider] = useState<string | null>(null);
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

  const handleApiKeyError = (provider: string) => {
    setApiKeyErrorProvider(provider);
  };

  const handleGoToApiKeys = () => {
    setApiKeyErrorProvider(null);
    setSettingsOpen(true);
  };

  const handleSelectAIModel = () => {
    setApiKeyErrorProvider(null);
    // Expand parameter panel if collapsed
    if (parameterPanelCollapsed) {
      setParameterPanelCollapsed(false);
    }
    // Focus the model selector
    setTimeout(() => {
      parameterPanelRef.current?.focusModelSelector();
    }, 100);
  };

  return (
    <>
      {comparisonMode ? (
        <ComparisonView />
      ) : (
        <MainLayout
          header={<Header onOpenSettings={() => setSettingsOpen(true)} />}
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
              onApiKeyError={handleApiKeyError}
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

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <BotEditorModal
        isOpen={botEditorOpen}
        onClose={() => setBotEditorOpen(false)}
        bot={editingBot}
        onSave={handleSaveBot}
        onDelete={deleteBot}
      />

      <Modal
        isOpen={apiKeyErrorProvider !== null}
        onClose={() => setApiKeyErrorProvider(null)}
        title="API Key Required"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleSelectAIModel}>
              Select AI Model
            </Button>
            <Button onClick={handleGoToApiKeys}>
              Go to API Keys
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Please configure your <strong>{apiKeyErrorProvider}</strong> API key in settings to send messages.
        </p>
      </Modal>
    </>
  );
}
