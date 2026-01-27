import type { Task, EmployeeChatMessage } from '../../types/performance';
import './StatsDetailModal.css';

export type StatsDetailType =
  | 'all-messages'
  | 'work-messages'
  | 'non-work-messages'
  | 'all-tasks'
  | 'active-tasks'
  | 'overdue-tasks'
  | 'completed-tasks'
  | 'single-task';

interface StatsDetailModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly type: StatsDetailType;
  readonly tasks: Task[];
  readonly messages: EmployeeChatMessage[];
  readonly employeeName?: string;
  readonly customTitle?: string;
}

const typeLabels: Record<StatsDetailType, string> = {
  'all-messages': 'All Messages',
  'work-messages': 'Work Related Messages',
  'non-work-messages': 'Non-Work Messages',
  'all-tasks': 'All Tasks',
  'active-tasks': 'Active Tasks',
  'overdue-tasks': 'Overdue Tasks',
  'completed-tasks': 'Completed Tasks',
  'single-task': 'Task Details',
};

const nonWorkKeywords = ['game', 'lunch', 'funny', 'video', 'marvel', 'trailer', 'watch'];

function isNonWorkMessage(content: string): boolean {
  return nonWorkKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'completed':
      return 'var(--accent-green)';
    case 'in_progress':
      return 'var(--accent-blue)';
    case 'overdue':
      return 'var(--accent-red)';
    case 'pending':
      return 'var(--accent-yellow)';
    default:
      return 'var(--text-muted)';
  }
}

function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'urgent':
      return 'var(--accent-red)';
    case 'high':
      return '#e67e22';
    case 'medium':
      return 'var(--accent-yellow)';
    case 'low':
      return 'var(--accent-green)';
    default:
      return 'var(--text-muted)';
  }
}

export function StatsDetailModal({
  isOpen,
  onClose,
  type,
  tasks,
  messages,
  employeeName,
  customTitle,
}: StatsDetailModalProps) {
  if (!isOpen) return null;

  // Filter data based on type
  const filteredMessages = (() => {
    switch (type) {
      case 'all-messages':
        return messages;
      case 'work-messages':
        return messages.filter(m => !isNonWorkMessage(m.content));
      case 'non-work-messages':
        return messages.filter(m => isNonWorkMessage(m.content));
      default:
        return [];
    }
  })();

  const filteredTasks = (() => {
    switch (type) {
      case 'all-tasks':
        return tasks;
      case 'active-tasks':
        return tasks.filter(t => t.status === 'in_progress' || t.status === 'pending');
      case 'overdue-tasks':
        return tasks.filter(t => t.status === 'overdue');
      case 'completed-tasks':
        return tasks.filter(t => t.status === 'completed');
      case 'single-task':
        return tasks; // For single-task, we expect tasks array to already contain just the one task
      default:
        return [];
    }
  })();

  const isMessageType = type.includes('messages');

  const getTitle = () => {
    if (customTitle) return customTitle;
    if (employeeName) return `${employeeName} - ${typeLabels[type]}`;
    return typeLabels[type];
  };
  const title = getTitle();

  return (
    <div className="ai-studio-stats-modal-overlay" onClick={onClose}>
      <div className="ai-studio-stats-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-studio-stats-modal-header">
          <h2>{title}</h2>
          <button className="ai-studio-stats-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ai-studio-stats-modal-content">
          {isMessageType ? (
            <div className="ai-studio-stats-list">
              {filteredMessages.length === 0 ? (
                <div className="ai-studio-stats-empty">No messages found</div>
              ) : (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    className={`ai-studio-stats-item message ${isNonWorkMessage(message.content) ? 'non-work' : 'work'}`}
                  >
                    <div className="ai-studio-stats-item-header">
                      <span className="ai-studio-stats-item-participants">
                        {message.participantNames.join(', ')}
                      </span>
                      <span className="ai-studio-stats-item-date">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <p className="ai-studio-stats-item-content">{message.content}</p>
                    <span className={`ai-studio-stats-item-badge ${isNonWorkMessage(message.content) ? 'non-work' : 'work'}`}>
                      {isNonWorkMessage(message.content) ? 'Non-Work' : 'Work'}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="ai-studio-stats-list">
              {filteredTasks.length === 0 ? (
                <div className="ai-studio-stats-empty">No tasks found</div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className="ai-studio-stats-item task">
                    <div className="ai-studio-stats-item-header">
                      <span className="ai-studio-stats-item-title">{task.title}</span>
                      <span
                        className="ai-studio-stats-item-status"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="ai-studio-stats-item-content">{task.description}</p>
                    <div className="ai-studio-stats-item-meta">
                      <span
                        className="ai-studio-stats-item-priority"
                        style={{ color: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                      <span className="ai-studio-stats-item-date">
                        Due: {formatDate(task.deadline)}
                      </span>
                      {task.estimatedHours && (
                        <span className="ai-studio-stats-item-hours">
                          Est: {task.estimatedHours}h
                        </span>
                      )}
                      {task.actualHours && (
                        <span className="ai-studio-stats-item-hours">
                          Actual: {task.actualHours}h
                        </span>
                      )}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="ai-studio-stats-item-tags">
                        {task.tags.map(tag => (
                          <span key={tag} className="ai-studio-stats-item-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="ai-studio-stats-modal-footer">
          <span className="ai-studio-stats-count">
            {isMessageType
              ? `${filteredMessages.length} message${filteredMessages.length !== 1 ? 's' : ''}`
              : `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
          </span>
          <button className="ai-studio-stats-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
