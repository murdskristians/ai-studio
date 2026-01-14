import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (id: string, content: string, shouldResend: boolean) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export function ChatMessage({ message, isStreaming, onEdit, onDelete, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const textarea = editTextareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [isEditing]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(message.id, editContent, true);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`ai-studio-chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="ai-studio-message-avatar">
        {isUser ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12.5 7H17.5L13.5 10.5L15 16L10 13L5 16L6.5 10.5L2.5 7H7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="ai-studio-message-content">
        <div className="ai-studio-message-header">
          <span className="ai-studio-message-role">{isUser ? 'You' : 'Assistant'}</span>
          {message.model && !isUser && (
            <span className="ai-studio-message-model">{message.model}</span>
          )}
        </div>

        {isEditing ? (
          <div className="ai-studio-message-edit">
            <textarea
              ref={editTextareaRef}
              className="ai-studio-message-edit-input"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
            />
            <div className="ai-studio-message-edit-actions">
              <button className="ai-studio-action-btn" onClick={handleSaveEdit} title="Save (Enter)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="ai-studio-action-btn" onClick={handleCancelEdit} title="Cancel (Esc)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`ai-studio-message-text ${isStreaming ? 'streaming' : ''}`}>
              {isUser ? (
                <p>{message.content}</p>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
              {isStreaming && <span className="ai-studio-cursor" />}
            </div>

            {!isStreaming && (
              <div className="ai-studio-message-actions">
                <button className="ai-studio-action-btn" onClick={copyToClipboard} title="Copy to clipboard">
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
                {isUser && onEdit && (
                  <button className="ai-studio-action-btn" onClick={handleEdit} title="Edit">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5L13.5 4.5L6 12H4V10L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {isUser && onRegenerate && (
                  <button className="ai-studio-action-btn" onClick={handleRegenerate} title="Rerun">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8C2 5.23858 4.23858 3 7 3C8.65685 3 10.1569 3.67157 11.1213 4.70711" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14 8C14 10.7614 11.7614 13 9 13C7.34315 13 5.84315 12.3284 4.87868 11.2929" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M11.1213 4.70711L13 3L11.1213 1.29289" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.87868 11.2929L3 13L4.87868 14.7071" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button className="ai-studio-action-btn" onClick={handleDelete} title="Delete">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7.5V11.5M10 7.5V11.5M4 4V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
