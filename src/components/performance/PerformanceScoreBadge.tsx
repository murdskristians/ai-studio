import type { PerformanceLevel } from '../../types/performance';
import './PerformanceScoreBadge.css';

interface PerformanceScoreBadgeProps {
  score: number | null;
  level?: PerformanceLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

function getLevel(score: number): PerformanceLevel {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'below_average';
  return 'poor';
}

function getLevelLabel(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'average':
      return 'Average';
    case 'below_average':
      return 'Below Avg';
    case 'poor':
      return 'Poor';
  }
}

export function PerformanceScoreBadge({
  score,
  level,
  size = 'medium',
  showLabel = false,
}: PerformanceScoreBadgeProps) {
  if (score === null) {
    return (
      <div className={`ai-studio-score-badge ${size} not-analyzed`}>
        <span className="ai-studio-score-value">—</span>
        {showLabel && <span className="ai-studio-score-label">Not analyzed</span>}
      </div>
    );
  }

  const effectiveLevel = level || getLevel(score);

  return (
    <div className={`ai-studio-score-badge ${size} ${effectiveLevel}`}>
      <span className="ai-studio-score-value">{score}</span>
      {showLabel && <span className="ai-studio-score-label">{getLevelLabel(effectiveLevel)}</span>}
    </div>
  );
}
