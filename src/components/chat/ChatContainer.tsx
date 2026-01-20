import { useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useApp } from '../../contexts';
import type { Message } from '../../types';
import './ChatContainer.css';

interface ChatContainerProps {
  readonly messages: Message[];
  readonly onSendMessage: (message: string) => void | Promise<{ success: boolean; error?: string; provider?: string } | void>;
  readonly isLoading?: boolean;
  readonly streamingMessageId?: string | null;
  readonly hideInput?: boolean;
  readonly onDeleteMessage?: (id: string) => void;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading,
  streamingMessageId,
  hideInput = false,
  onDeleteMessage,
}: ChatContainerProps) {
  const { updateMessage, deleteMessage: contextDeleteMessage, sendMessage, cancelSendMessage } = useApp();

  // Use provided onDeleteMessage or fall back to context's deleteMessage
  const deleteMessage = onDeleteMessage || contextDeleteMessage;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const prevMessageCount = useRef(messages.length);

  // Instant scroll on initial mount (before paint) to avoid visible scrolling
  useLayoutEffect(() => {
    if (isInitialMount.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialMount.current = false;
    }
  }, [messages.length]);

  // Smooth scroll for new messages after initial load
  useEffect(() => {
    // Skip if this is the initial mount
    if (isInitialMount.current) return;

    // Only smooth scroll when messages are added
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Extract user message history for arrow key navigation (most recent first)
  const messageHistory = useMemo(() => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .reverse();
  }, [messages]);

  const handleEdit = async (messageId: string, newContent: string, shouldResend: boolean) => {
    updateMessage(messageId, newContent);
    
    if (shouldResend) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.role === 'user') {
        const nextMessageIndex = messageIndex + 1;
        if (nextMessageIndex < messages.length && messages[nextMessageIndex].role === 'assistant') {
          deleteMessage(messages[nextMessageIndex].id);
        }
        await sendMessage(newContent);
      }
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    
    if (message.role === 'user') {
      const nextMessageIndex = messageIndex + 1;
      if (nextMessageIndex < messages.length && messages[nextMessageIndex].role === 'assistant') {
        deleteMessage(messages[nextMessageIndex].id);
      }
      await sendMessage(message.content);
    } else if (message.role === 'assistant') {
      const userMessageIndex = messageIndex - 1;
      if (userMessageIndex < 0) return;

      const userMessage = messages[userMessageIndex];
      if (userMessage.role !== 'user') return;

      deleteMessage(messageId);
      await sendMessage(userMessage.content);
    }
  };

  return (
    <div className="ai-studio-chat-container">
      <div className="ai-studio-chat-messages-wrapper">
        {hasMessages ? (
          <div className="ai-studio-chat-messages">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
                onEdit={handleEdit}
                onDelete={deleteMessage}
                onRegenerate={handleRegenerate}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="ai-studio-chat-empty">
            <div className="ai-studio-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 9L30 19H42L33 27L36 39L24 33L12 39L15 27L6 19H18L24 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="ai-studio-empty-title">Start a conversation</h3>
            <p className="ai-studio-empty-description">
              Type a message below to begin chatting with the AI assistant.
              Configure the system prompt and parameters to customize behavior.
            </p>
          </div>
        )}
      </div>

      {!hideInput && (
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? 'Generating response...' : 'Type a message...'}
        messageHistory={messageHistory}
        onCancel={cancelSendMessage}
        isLoading={isLoading}
      />
      )}
    </div>
  );
}
