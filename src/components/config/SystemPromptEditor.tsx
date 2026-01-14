import { useState } from 'react';
import { TextArea } from '../ui';
import './SystemPromptEditor.css';

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SystemPromptEditor({ value, onChange, collapsed, onToggleCollapse }: SystemPromptEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const trimmedValue = (value || '').trim();
  const hasContent = trimmedValue.length > 0;
  const displayValue = (isFocused || hasContent) ? (value || '') : '';

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = (value || '').trim();
    if (trimmed.length === 0 && value) {
      onChange('');
    }
  };

  return (
    <div className={`ai-studio-system-prompt-editor ${collapsed ? 'collapsed' : ''}`}>
      <div className="ai-studio-editor-header" onClick={onToggleCollapse}>
        <div className="ai-studio-editor-title-wrapper">
          <span className="ai-studio-editor-title">System Instructions</span>
          {hasContent && (
            <svg className="ai-studio-editor-checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 4.5L6 12L2.5 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <button className="ai-studio-collapse-btn" aria-label={collapsed ? 'Expand' : 'Collapse'}>
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
        <div className="ai-studio-editor-content">
          <TextArea
            id="system-instructions-textarea"
            name="system-instructions"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="These instructions will run before each prompt. Use them to define the AI's behavior, persona, role, or provide context that should be considered in every conversation..."
            style={{ flex: 1 }}
          />
          <div className="ai-studio-editor-footer">
            <span className="ai-studio-char-count">{trimmedValue.length} characters</span>
          </div>
        </div>
      )}

    </div>
  );
}
