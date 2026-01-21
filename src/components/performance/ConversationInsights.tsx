import type { ConversationSummary } from '../../types/performance';
import './ConversationInsights.css';

interface ConversationInsightsProps {
  summary: ConversationSummary;
}

export function ConversationInsights({ summary }: ConversationInsightsProps) {
  const {
    totalMessages,
    workRelatedMessages,
    nonWorkRelatedMessages,
    workRelatedPercentage,
    topicsDiscussed,
    summaryText,
    estimatedChatTime,
    meetingTime,
  } = summary;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work':
        return 'work';
      case 'personal':
        return 'personal';
      case 'administrative':
        return 'admin';
      case 'social':
        return 'social';
      default:
        return 'other';
    }
  };

  return (
    <div className="ai-studio-conversation-insights">
      {/* Summary Text */}
      <div className="ai-studio-conversation-summary">
        <p>{summaryText}</p>
      </div>

      {/* Stats */}
      <div className="ai-studio-conversation-stats">
        <div className="ai-studio-conversation-stat">
          <span className="ai-studio-stat-value">{totalMessages}</span>
          <span className="ai-studio-stat-label">Total Messages</span>
        </div>
        <div className="ai-studio-conversation-stat work">
          <span className="ai-studio-stat-value">{workRelatedMessages}</span>
          <span className="ai-studio-stat-label">Work Related</span>
        </div>
        <div className="ai-studio-conversation-stat other">
          <span className="ai-studio-stat-value">{nonWorkRelatedMessages}</span>
          <span className="ai-studio-stat-label">Non-Work</span>
        </div>
        <div className="ai-studio-conversation-stat">
          <span className="ai-studio-stat-value">{estimatedChatTime}m</span>
          <span className="ai-studio-stat-label">Chat Time</span>
        </div>
        {meetingTime > 0 && (
          <div className="ai-studio-conversation-stat">
            <span className="ai-studio-stat-value">{meetingTime}m</span>
            <span className="ai-studio-stat-label">Meeting Time</span>
          </div>
        )}
      </div>

      {/* Work Percentage Bar */}
      <div className="ai-studio-work-percentage">
        <div className="ai-studio-work-percentage-header">
          <span>Work-Related Communication</span>
          <span className={workRelatedPercentage >= 70 ? 'good' : workRelatedPercentage >= 50 ? 'average' : 'low'}>
            {workRelatedPercentage}%
          </span>
        </div>
        <div className="ai-studio-work-percentage-bar">
          <div
            className={`ai-studio-work-percentage-fill ${workRelatedPercentage >= 70 ? 'good' : workRelatedPercentage >= 50 ? 'average' : 'low'}`}
            style={{ width: `${workRelatedPercentage}%` }}
          />
        </div>
      </div>

      {/* Topics */}
      {topicsDiscussed.length > 0 && (
        <div className="ai-studio-topics">
          <h4>Discussion Topics</h4>
          <div className="ai-studio-topics-list">
            {topicsDiscussed.map((topic, index) => (
              <div key={index} className={`ai-studio-topic ${getCategoryColor(topic.category)}`}>
                <span className="ai-studio-topic-name">{topic.topic}</span>
                <span className="ai-studio-topic-category">{topic.category}</span>
                <span className="ai-studio-topic-count">{topic.messageCount} msgs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
