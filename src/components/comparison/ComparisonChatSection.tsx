import { ChatContainer } from '../chat';
import type { Message } from '../../types';
import './ComparisonChatSection.css';

interface ComparisonChatSectionProps {
  readonly messages: Message[];
  readonly isLoading: boolean;
  readonly streamingMessageId: string | null;
  readonly collapsed: boolean;
  readonly onToggleCollapse: () => void;
}

export function ComparisonChatSection({
  messages,
  isLoading,
  streamingMessageId,
  collapsed,
  onToggleCollapse,
}: ComparisonChatSectionProps) {
  return (
    <div className={`ai-studio-comparison-chat-section ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="ai-studio-comparison-chat-header"
        onClick={onToggleCollapse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <h3 className="ai-studio-comparison-chat-title">Conversation</h3>
        <button className="ai-studio-comparison-chat-toggle" aria-label={collapsed ? 'Expand' : 'Collapse'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d={collapsed ? "M4 6L8 10L12 6" : "M4 10L8 6L12 10"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="ai-studio-comparison-chat-content">
          <ChatContainer
            messages={messages}
            onSendMessage={() => {}}
            isLoading={isLoading}
            streamingMessageId={streamingMessageId}
            hideInput={true}
          />
        </div>
      )}
    </div>
  );
}
