import { TextArea } from '../ui';
import './SystemPromptEditor.css';

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SystemPromptEditor({ value, onChange, collapsed, onToggleCollapse }: SystemPromptEditorProps) {
  return (
    <div className={`ai-studio-system-prompt-editor ${collapsed ? 'collapsed' : ''}`}>
      <div className="ai-studio-editor-header" onClick={onToggleCollapse}>
        <div className="ai-studio-editor-title-wrapper">
          <span className="ai-studio-editor-title">System Instructions</span>
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
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="These instructions will run before each prompt. Use them to define the AI's behavior, persona, role, or provide context that should be considered in every conversation..."
            style={{ flex: 1 }}
          />
          <div className="ai-studio-editor-footer">
            <span className="ai-studio-char-count">{(value || '').length} characters</span>
          </div>
        </div>
      )}

      {collapsed && value && (
        <div className="ai-studio-prompt-preview">
          {value.slice(0, 100)}{value.length > 100 ? '...' : ''}
        </div>
      )}
    </div>
  );
}
