import { useState } from 'react';
import { Button } from '../ui';
import { Modal } from '../ui';
import { useApp } from '../../contexts';
import './Header.css';

interface HeaderProps {
  readonly performanceMode?: boolean;
  readonly onTogglePerformanceMode?: () => void;
}

export function Header({ performanceMode = false, onTogglePerformanceMode }: HeaderProps) {
  const {
    comparisonMode,
    setComparisonMode,
    clearMessages,
    settings,
    updateSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
    parameterPanelCollapsed,
    setParameterPanelCollapsed,
  } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || '');

  // On mobile the drawers overlay the chat, so only one may be open at a time.
  const handleToggleSidebar = () => {
    const opening = sidebarCollapsed;
    setSidebarCollapsed(!sidebarCollapsed);
    if (opening) setParameterPanelCollapsed(true);
  };

  const handleTogglePanel = () => {
    const opening = parameterPanelCollapsed;
    setParameterPanelCollapsed(!parameterPanelCollapsed);
    if (opening) setSidebarCollapsed(true);
  };

  const handleToggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
  };

  const handleClearConversation = () => {
    clearMessages();
  };

  return (
    <header className="ai-studio-header">
      <div className="ai-studio-header-left">
        <button
          className="ai-studio-drawer-toggle ai-studio-mobile-only"
          onClick={handleToggleSidebar}
          aria-label={sidebarCollapsed ? 'Show bots' : 'Hide bots'}
          aria-expanded={!sidebarCollapsed}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {comparisonMode && (
          <button className="ai-studio-back-btn" onClick={handleToggleComparisonMode} title="Exit comparison">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="ai-studio-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 8H21L16.5 12.5L18 19L12 15.5L6 19L7.5 12.5L3 8H9L12 2Z" fill="currentColor" />
          </svg>
          <span className="ai-studio-logo-text">AI Studio</span>
        </div>
      </div>

      <div className="ai-studio-header-center">
        {/* Model selector moved to ParameterPanel */}
      </div>

      <div className="ai-studio-header-right">
        <Button variant="ghost" size="sm" onClick={handleClearConversation} className="clear-conversation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4H14M5 4V2.5C5 2.22386 5.22386 2 5.5 2H10.5C10.7761 2 11 2.22386 11 2.5V4M6 7V11M10 7V11M3 4L4 13.5C4 13.7761 4.22386 14 4.5 14H11.5C11.7761 14 12 13.7761 12 13.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="ai-studio-btn-label">Clear</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggleComparisonMode} className={comparisonMode ? 'active' : ''}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3.5H6C4.61929 3.5 3.5 4.61929 3.5 6V10C3.5 11.3807 4.61929 12.5 6 12.5H10C11.3807 12.5 12.5 11.3807 12.5 10V6C12.5 4.61929 11.3807 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 3.5V2C6 1.44772 6.44772 1 7 1H9C9.55228 1 10 1.44772 10 2V3.5M12.5 6H14C14.5523 6 15 6.44772 15 7V9C15 9.55228 14.5523 10 14 10H12.5M3.5 6H2C1.44772 6 1 6.44772 1 7V9C1 9.55228 1.44772 10 2 10H3.5M10 12.5V14C10 14.5523 9.55228 15 9 15H7C6.44772 15 6 14.5523 6 14V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="ai-studio-btn-label">Compare</span>
        </Button>
        {onTogglePerformanceMode && (
          <Button variant="ghost" size="sm" onClick={onTogglePerformanceMode} className={performanceMode ? 'active' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10.5 14v-1.33a2.67 2.67 0 0 0-2.67-2.67H4a2.67 2.67 0 0 0-2.67 2.67V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.92" cy="4.67" r="2.67" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.67 14v-1.33a2.67 2.67 0 0 0-2-2.58M10.67 2.09a2.67 2.67 0 0 1 0 5.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ai-studio-btn-label">Performance</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <span className="ai-studio-btn-label">Settings</span>
        </Button>
        <button
          className="ai-studio-drawer-toggle ai-studio-mobile-only"
          onClick={handleTogglePanel}
          aria-label={parameterPanelCollapsed ? 'Show parameters' : 'Hide parameters'}
          aria-expanded={!parameterPanelCollapsed}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h9M15 6h2M3 14h2M8 14h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="13.5" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="6.5" cy="14" r="2" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="sm">
        <div className="ai-studio-settings-form">
          <label className="ai-studio-settings-label">
            Gemini API Key
            <input
              type="password"
              className="ai-studio-settings-input"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
            />
            <span className="ai-studio-settings-hint">
              Get your free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </span>
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              updateSettings({ apiKeys: { ...settings.apiKeys, gemini: geminiKey } });
              setSettingsOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </header>
  );
}
