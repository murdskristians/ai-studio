import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '../ui';
import './ChatInput.css';

interface ChatInputProps {
  readonly onSend: (message: string) => void | Promise<{ success: boolean; error?: string; provider?: string } | void>;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly messageHistory?: string[];
  readonly onCancel?: () => void;
  readonly isLoading?: boolean;
}

export function ChatInput({ onSend, disabled, placeholder = 'Type a message...', messageHistory = [], onCancel, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempValue, setTempValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (value.trim() && !disabled && !isSubmitting) {
      const messageToSend = value.trim();
      setIsSubmitting(true);

      try {
        await onSend(messageToSend);

        // Clear the input
        setValue('');
        setHistoryIndex(-1);
        setTempValue('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Navigate to older message in history
  const navigateHistoryUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const canNavigate = historyIndex >= 0 || value === '' || textareaRef.current?.selectionStart === 0;
    if (!canNavigate) return;

    e.preventDefault();
    if (historyIndex === -1) {
      setTempValue(value);
    }
    const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex);
      setValue(messageHistory[newIndex]);
    }
  };

  // Navigate to newer message in history
  const navigateHistoryDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setValue(newIndex === -1 ? tempValue : messageHistory[newIndex]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
        break;
      case 'Escape':
        if (isLoading && onCancel) {
          e.preventDefault();
          onCancel();
        }
        break;
      case 'ArrowUp':
        if (messageHistory.length > 0) {
          navigateHistoryUp(e);
        }
        break;
      case 'ArrowDown':
        if (historyIndex >= 0) {
          navigateHistoryDown(e);
        }
        break;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Global Escape key listener for canceling requests
  useEffect(() => {
    if (!isLoading || !onCancel) return;

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    globalThis.addEventListener('keydown', handleGlobalKeyDown);
    return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLoading, onCancel]);

  return (
    <div className="ai-studio-chat-input-container">
      <div className="ai-studio-chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="ai-studio-chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        {isLoading && onCancel ? (
          <Button
            onClick={onCancel}
            className="ai-studio-cancel-btn"
            title="Cancel request (Escape)"
            variant="secondary"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="ai-studio-send-btn"
            title="Send message (Enter)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        )}
      </div>
      <p className="ai-studio-chat-input-hint">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
}
