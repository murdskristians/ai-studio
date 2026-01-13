import { useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SystemPromptEditor } from '../config';
import type { Message } from '../../types';
import './ChatContainer.css';

interface ChatContainerProps {
  messages: Message[];
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingMessageId?: string | null;
}

export function ChatContainer({
  messages,
  systemPrompt,
  onSystemPromptChange,
  onSendMessage,
  isLoading,
  streamingMessageId,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Extract user message history for arrow key navigation (most recent first)
  const messageHistory = useMemo(() => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .reverse();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-messages-wrapper">
        <div className="system-prompt-section">
          <SystemPromptEditor
            value={systemPrompt}
            onChange={onSystemPromptChange}
          />
        </div>

        {!hasMessages ? (
          <div className="chat-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L30 14H42L33 22L36 34L24 28L12 34L15 22L6 14H18L24 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="empty-title">Start a conversation</h3>
            <p className="empty-description">
              Type a message below to begin chatting with the AI assistant.
              Configure the system prompt and parameters to customize behavior.
            </p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? 'Generating response...' : 'Type a message...'}
        messageHistory={messageHistory}
      />
    </div>
  );
}
