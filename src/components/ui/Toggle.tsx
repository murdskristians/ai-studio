import './Toggle.css';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, description, disabled }: ToggleProps) {
  return (
    <div className="ai-studio-toggle-container">
      <div className="ai-studio-toggle-header">
        <span className="ai-studio-toggle-label">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={`ai-studio-toggle ${checked ? 'checked' : ''}`}
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
        >
          <span className="ai-studio-toggle-thumb" />
        </button>
      </div>
      {description && (
        <p className="ai-studio-toggle-description">{description}</p>
      )}
    </div>
  );
}
