import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '../ui';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  messageHistory?: string[];
}

export function ChatInput({ onSend, disabled, placeholder = 'Type a message...', messageHistory = [] }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempValue, setTempValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      setHistoryIndex(-1);
      setTempValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Arrow Up - go back in history (older messages)
    if (e.key === 'ArrowUp' && messageHistory.length > 0) {
      // Allow navigation if: already in history mode, input is empty, or cursor at start
      const textarea = textareaRef.current;
      const canNavigate = historyIndex >= 0 || value === '' || (textarea && textarea.selectionStart === 0);

      if (canNavigate) {
        e.preventDefault();
        if (historyIndex === -1) {
          // Save current input before navigating
          setTempValue(value);
        }
        const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
        if (newIndex !== historyIndex) {
          setHistoryIndex(newIndex);
          setValue(messageHistory[newIndex]);
        }
      }
    }

    // Arrow Down - go forward in history (newer messages)
    if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        // Restore the temp value
        setValue(tempValue);
      } else {
        setValue(messageHistory[newIndex]);
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="send-btn"
          title="Send message (Enter)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
      <p className="chat-input-hint">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
}
