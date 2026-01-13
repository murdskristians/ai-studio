import { useState, KeyboardEvent } from 'react';
import './TagInput.css';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ label, tags, onChange, placeholder = 'Type and press Enter', maxTags = 5 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (tags.length < maxTags && !tags.includes(inputValue.trim())) {
        onChange([...tags, inputValue.trim()]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="ai-studio-tag-input-wrapper">
      {label && <label className="ai-studio-tag-input-label">{label}</label>}
      <div className="ai-studio-tag-input-container">
        {tags.map((tag, index) => (
          <span key={index} className="ai-studio-tag">
            {tag}
            <button
              type="button"
              className="ai-studio-tag-remove"
              onClick={() => removeTag(index)}
              aria-label={`Remove ${tag}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            type="text"
            className="ai-studio-tag-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
          />
        )}
      </div>
      <span className="ai-studio-tag-input-hint">{tags.length}/{maxTags} sequences</span>
    </div>
  );
}
