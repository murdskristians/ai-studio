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
  const { comparisonMode, setComparisonMode, clearMessages, settings, updateSettings } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || '');

  const handleToggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
  };

  const handleClearConversation = () => {
    clearMessages();
  };

  return (
    <header className="ai-studio-header">
      <div className="ai-studio-header-left">
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
          Clear
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggleComparisonMode} className={comparisonMode ? 'active' : ''}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3.5H6C4.61929 3.5 3.5 4.61929 3.5 6V10C3.5 11.3807 4.61929 12.5 6 12.5H10C11.3807 12.5 12.5 11.3807 12.5 10V6C12.5 4.61929 11.3807 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 3.5V2C6 1.44772 6.44772 1 7 1H9C9.55228 1 10 1.44772 10 2V3.5M12.5 6H14C14.5523 6 15 6.44772 15 7V9C15 9.55228 14.5523 10 14 10H12.5M3.5 6H2C1.44772 6 1 6.44772 1 7V9C1 9.55228 1.44772 10 2 10H3.5M10 12.5V14C10 14.5523 9.55228 15 9 15H7C6.44772 15 6 14.5523 6 14V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Compare
        </Button>
        {onTogglePerformanceMode && (
          <Button variant="ghost" size="sm" onClick={onTogglePerformanceMode} className={performanceMode ? 'active' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10.5 14v-1.33a2.67 2.67 0 0 0-2.67-2.67H4a2.67 2.67 0 0 0-2.67 2.67V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.92" cy="4.67" r="2.67" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.67 14v-1.33a2.67 2.67 0 0 0-2-2.58M10.67 2.09a2.67 2.67 0 0 1 0 5.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Performance
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.86 2.57a1.14 1.14 0 0 1 2.28 0c.04.5.37.93.84 1.1a1.14 1.14 0 0 0 1.37-.38 1.14 1.14 0 0 1 1.61 1.61c-.24.36-.2.84.1 1.16.3.32.76.42 1.16.27a1.14 1.14 0 0 1 1.14 1.97c-.36.24-.57.64-.57 1.07s.21.83.57 1.07a1.14 1.14 0 0 1-1.14 1.97c-.4-.15-.86-.05-1.16.27-.3.32-.34.8-.1 1.16a1.14 1.14 0 0 1-1.61 1.61 1.14 1.14 0 0 0-1.37-.38c-.47.17-.8.6-.84 1.1a1.14 1.14 0 0 1-2.28 0 1.14 1.14 0 0 0-.84-1.1 1.14 1.14 0 0 0-1.37.38 1.14 1.14 0 0 1-1.61-1.61c.24-.36.2-.84-.1-1.16a1.14 1.14 0 0 0-1.16-.27 1.14 1.14 0 0 1-1.14-1.97c.36-.24.57-.64.57-1.07s-.21-.83-.57-1.07A1.14 1.14 0 0 1 1.78 4.9c.4.15.86.05 1.16-.27.3-.32.34-.8.1-1.16a1.14 1.14 0 0 1 1.61-1.61c.36.24.84.2 1.16-.1.32-.3.42-.76.27-1.16z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="8" cy="8" r="2.29" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
          Settings
        </Button>
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
