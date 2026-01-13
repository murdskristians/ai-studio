import { ModelSelector } from '../model';
import { Button } from '../ui';
import { useApp } from '../../contexts';
import './Header.css';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { selectedModel, setSelectedModel } = useApp();

  return (
    <header className="ai-studio-header">
      <div className="ai-studio-header-left">
        <div className="ai-studio-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 8H21L16.5 12.5L18 19L12 15.5L6 19L7.5 12.5L3 8H9L12 2Z" fill="currentColor" />
          </svg>
          <span className="ai-studio-logo-text">AI Studio</span>
        </div>
      </div>

      <div className="ai-studio-header-center">
        <ModelSelector
          value={selectedModel.id}
          onChange={setSelectedModel}
        />
      </div>

      <div className="ai-studio-header-right">
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 5H11V3C11 1.9 10.1 1 9 1H7C5.9 1 5 1.9 5 3V5H3C1.9 5 1 5.9 1 7V9C1 10.1 1.9 11 3 11H5V13C5 14.1 5.9 15 7 15H9C10.1 15 11 14.1 11 13V11H13C14.1 11 15 10.1 15 9V7C15 5.9 14.1 5 13 5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          API Keys
        </Button>
      </div>
    </header>
  );
}
