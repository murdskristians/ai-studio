import type { PerformanceFlag } from '../../types/performance';
import './PerformanceFlags.css';

interface PerformanceFlagsProps {
  flags: PerformanceFlag[];
}

export function PerformanceFlags({ flags }: PerformanceFlagsProps) {
  if (flags.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'delay':
        return 'Delay';
      case 'low_productivity':
        return 'Low Productivity';
      case 'excessive_chat':
        return 'Communication';
      case 'missed_deadline':
        return 'Missed Deadline';
      case 'pattern_detected':
        return 'Pattern';
      case 'unjustified_delay':
        return 'Unjustified Delay';
      default:
        return type;
    }
  };

  // Sort flags by severity (critical first)
  const sortedFlags = [...flags].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="ai-studio-performance-flags">
      {sortedFlags.map(flag => (
        <div key={flag.id} className={`ai-studio-flag ${flag.severity}`}>
          <div className="ai-studio-flag-icon">
            {getSeverityIcon(flag.severity)}
          </div>
          <div className="ai-studio-flag-content">
            <div className="ai-studio-flag-header">
              <span className="ai-studio-flag-title">{flag.title}</span>
              <span className="ai-studio-flag-type">{getTypeLabel(flag.type)}</span>
            </div>
            <p className="ai-studio-flag-description">{flag.description}</p>
            {flag.evidence.length > 0 && (
              <ul className="ai-studio-flag-evidence">
                {flag.evidence.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
