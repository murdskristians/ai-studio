import { useRef } from 'react';
import { Button } from '../ui';
import { useApp } from '../../contexts';
import './Sidebar.css';

interface SidebarProps {
  onEditBot?: (botId: string) => void;
  onCreateBot?: () => void;
}

export function Sidebar({ onEditBot, onCreateBot }: SidebarProps) {
  const {
    bots,
    currentBot,
    setCurrentBot,
    conversations,
    currentConversation,
    loadConversation,
    deleteConversation,
    createConversation,
    clearMessages,
    sidebarCollapsed,
    setSidebarCollapsed,
    exportBot,
    exportAllBots,
    importBots,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const count = await importBots(file);
      alert(`Successfully imported ${count} bot(s)`);
    } catch (error) {
      alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset input
    e.target.value = '';
  };

  const handleNewChat = () => {
    clearMessages();
    createConversation();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar collapsed">
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(false)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Button variant="primary" size="sm" onClick={handleNewChat} className="new-chat-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Chat
        </Button>
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Bots Section */}
        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="section-title">Bots</h3>
            <div className="section-actions">
              <button className="section-action" onClick={handleImportClick} title="Import bots">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 10V2M7 2L4 5M7 2L10 5M2 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {bots.length > 0 && (
                <button className="section-action" onClick={exportAllBots} title="Export all bots">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V10M7 10L4 7M7 10L10 7M2 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              {onCreateBot && (
                <button className="section-action" onClick={onCreateBot} title="Create new bot">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="section-list">
            <button
              className={`list-item ${!currentBot ? 'active' : ''}`}
              onClick={() => setCurrentBot(null)}
            >
              <span className="item-icon default">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L10 5H14L11 8L12 13L8 10.5L4 13L5 8L2 5H6L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="item-text">Default Assistant</span>
            </button>

            {bots.map(bot => (
              <button
                key={bot.id}
                className={`list-item ${currentBot?.id === bot.id ? 'active' : ''}`}
                onClick={() => setCurrentBot(bot)}
              >
                <span className="item-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="6" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="7" r="1.5" fill="currentColor" />
                    <path d="M5 10.5C5.5 11.5 6.5 12 8 12C9.5 12 10.5 11.5 11 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="item-text">{bot.name}</span>
                <div className="item-actions">
                  <button
                    className="item-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportBot(bot.id);
                    }}
                    title="Export bot"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2V8M6 8L3.5 5.5M6 8L8.5 5.5M2 10H10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {onEditBot && (
                    <button
                      className="item-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBot(bot.id);
                      }}
                      title="Edit bot"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="section-title">History</h3>
          </div>

          <div className="section-list">
            {conversations.length === 0 ? (
              <p className="empty-text">No conversations yet</p>
            ) : (
              conversations.slice(0, 20).map(conv => (
                <div
                  key={conv.id}
                  className={`list-item conversation ${currentConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="conv-content">
                    <span className="item-text">{conv.title}</span>
                    <span className="item-meta">{formatDate(conv.updatedAt)}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="item-action delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9M3 3V10C3 10.5523 3.44772 11 4 11H8C8.55228 11 9 10.5523 9 10V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
