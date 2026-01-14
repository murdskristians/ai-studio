import { useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useApp } from '../../contexts';
import type { Message } from '../../types';
import './ChatContainer.css';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingMessageId?: string | null;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading,
  streamingMessageId,
}: ChatContainerProps) {
  const { updateMessage, deleteMessage, sendMessage } = useApp();
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
        {!hasMessages ? (
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
        ) : (
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
