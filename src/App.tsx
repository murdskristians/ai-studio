import { useState } from 'react';
import { AppProvider, useApp } from './contexts';
import { MainLayout, Header, Sidebar, SettingsModal } from './components/layout';
import { ChatContainer } from './components/chat';
import { ParameterPanel } from './components/config';
import { BotEditorModal } from './components/bots';
import type { Bot } from './types';

function AppContent() {
  const {
    messages,
    systemPrompt,
    setSystemPrompt,
    sendMessage,
    isLoading,
    streamingMessageId,
    parameters,
    setParameters,
    parameterPanelCollapsed,
    setParameterPanelCollapsed,
    bots,
    createBot,
    updateBot,
    deleteBot,
  } = useApp();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [botEditorOpen, setBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  const handleCreateBot = () => {
    setEditingBot(null);
    setBotEditorOpen(true);
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
    } else {
      createBot(botData);
    }
  };

  return (
    <>
      <MainLayout
        header={<Header onOpenSettings={() => setSettingsOpen(true)} />}
        sidebar={
          <Sidebar
            onCreateBot={handleCreateBot}
            onEditBot={handleEditBot}
          />
        }
        main={
          <ChatContainer
            messages={messages}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            streamingMessageId={streamingMessageId}
          />
        }
        panel={
          <ParameterPanel
            parameters={parameters}
            onChange={setParameters}
            collapsed={parameterPanelCollapsed}
            onToggleCollapse={() => setParameterPanelCollapsed(!parameterPanelCollapsed)}
          />
        }
      />

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
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
