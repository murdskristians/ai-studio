import { ModelSelector } from '../model';
import { Button } from '../ui';
import { useApp } from '../../contexts';
import './Header.css';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { selectedModel, setSelectedModel, clearMessages, createConversation } = useApp();

  const handleNewChat = () => {
    clearMessages();
    createConversation();
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 8H21L16.5 12.5L18 19L12 15.5L6 19L7.5 12.5L3 8H9L12 2Z" fill="currentColor" />
          </svg>
          <span className="logo-text">AI Studio</span>
        </div>
      </div>

      <div className="header-center">
        <ModelSelector
          value={selectedModel.id}
          onChange={setSelectedModel}
        />
      </div>

      <div className="header-right">
        <Button variant="ghost" size="sm" onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Chat
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1V3M8 13V15M1 8H3M13 8H15M2.93 2.93L4.34 4.34M11.66 11.66L13.07 13.07M2.93 13.07L4.34 11.66M11.66 4.34L13.07 2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Settings
        </Button>
      </div>
    </header>
  );
}
