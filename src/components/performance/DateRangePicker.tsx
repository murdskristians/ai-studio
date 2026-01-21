import type { DateRange } from '../../types/performance';
import './DateRangePicker.css';

interface DateRangePickerProps {
  readonly onShowCustomChange: (show: boolean) => void;
  readonly disabled?: boolean;
  readonly disabledTooltip?: string;
}

export function DateRangePicker({ onShowCustomChange, disabled, disabledTooltip }: DateRangePickerProps) {
  return (
    <button
      className={`ai-studio-date-select-btn ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onShowCustomChange(true)}
      disabled={disabled}
      title={disabled ? disabledTooltip : undefined}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      Select date
    </button>
  );
}

// Modal component with preset buttons and custom date inputs
interface DateRangeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dateRange: DateRange;
  readonly onChange: (range: DateRange) => void;
}

export function DateRangeModal({ isOpen, onClose, dateRange, onChange }: DateRangeModalProps) {
  if (!isOpen) return null;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const handlePresetChange = (days: number) => {
    const start = now - days * day;
    onChange({ start, end: now });
  };

  const formatDateForInput = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = new Date(e.target.value).getTime();
    onChange({ ...dateRange, start });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = new Date(e.target.value).getTime() + day - 1;
    onChange({ ...dateRange, end });
  };

  return (
    <div className="ai-studio-date-modal-overlay" onClick={onClose}>
      <div className="ai-studio-date-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-studio-date-modal-header">
          <h3>Select Date Range</h3>
          <button className="ai-studio-date-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ai-studio-date-modal-content">
          <div className="ai-studio-date-presets">
            <button
              className="ai-studio-date-preset"
              onClick={() => handlePresetChange(7)}
            >
              7 days
            </button>
            <button
              className="ai-studio-date-preset"
              onClick={() => handlePresetChange(14)}
            >
              14 days
            </button>
            <button
              className="ai-studio-date-preset"
              onClick={() => handlePresetChange(30)}
            >
              30 days
            </button>
          </div>

          <div className="ai-studio-date-custom">
            <input
              type="date"
              value={formatDateForInput(dateRange.start)}
              onChange={handleStartChange}
              className="ai-studio-date-input"
            />
            <span className="ai-studio-date-separator">to</span>
            <input
              type="date"
              value={formatDateForInput(dateRange.end)}
              onChange={handleEndChange}
              className="ai-studio-date-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
