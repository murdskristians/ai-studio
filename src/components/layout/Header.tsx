import { Button } from '../ui';
import { useApp } from '../../contexts';
import './Header.css';

export function Header() {
  const { comparisonMode, setComparisonMode, clearMessages } = useApp();

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
      </div>
    </header>
  );
}
