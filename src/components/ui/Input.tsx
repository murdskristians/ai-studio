import { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`ai-studio-input-wrapper ${className}`}>
      {label && <label htmlFor={inputId} className="ai-studio-input-label">{label}</label>}
      <input id={inputId} className={`ai-studio-input ${error ? 'ai-studio-input-error' : ''}`} {...props} />
      {error && <span className="ai-studio-input-error-text">{error}</span>}
    </div>
  );
}
