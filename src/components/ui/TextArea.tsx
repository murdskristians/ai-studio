import { TextareaHTMLAttributes } from 'react';
import './TextArea.css';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', id, ...props }: TextAreaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`ai-studio-textarea-wrapper ${className}`}>
      {label && <label htmlFor={textareaId} className="ai-studio-textarea-label">{label}</label>}
      <textarea id={textareaId} className={`ai-studio-textarea ${error ? 'ai-studio-textarea-error' : ''}`} {...props} />
      {error && <span className="ai-studio-textarea-error-text">{error}</span>}
    </div>
  );
}
