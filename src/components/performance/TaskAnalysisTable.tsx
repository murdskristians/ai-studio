import type { TaskAnalysisItem } from '../../types/performance';
import './TaskAnalysisTable.css';

interface TaskAnalysisTableProps {
  tasks: TaskAnalysisItem[];
}

export function TaskAnalysisTable({ tasks }: TaskAnalysisTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="ai-studio-task-table-empty">
        No tasks found for this period.
      </div>
    );
  }

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getStatusClass = (status: string, deliveredOnTime: boolean) => {
    if (status === 'completed' && deliveredOnTime) return 'on-time';
    if (status === 'completed' && !deliveredOnTime) return 'late';
    if (status === 'overdue') return 'overdue';
    if (status === 'in_progress') return 'in-progress';
    return 'pending';
  };

  return (
    <div className="ai-studio-task-table-container">
      <table className="ai-studio-task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Priority</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Est. Hours</th>
            <th>Delay</th>
            <th>Justified</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.taskId} className={getStatusClass(task.status, task.deliveredOnTime)}>
              <td className="ai-studio-task-title">{task.taskTitle}</td>
              <td>
                <span className={`ai-studio-priority-badge ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </td>
              <td>{formatDate(task.deadline)}</td>
              <td>
                <span className={`ai-studio-status-badge ${getStatusClass(task.status, task.deliveredOnTime)}`}>
                  {task.status === 'completed' && task.deliveredOnTime && 'On Time'}
                  {task.status === 'completed' && !task.deliveredOnTime && 'Late'}
                  {task.status === 'overdue' && 'Overdue'}
                  {task.status === 'in_progress' && 'In Progress'}
                  {task.status === 'pending' && 'Pending'}
                </span>
              </td>
              <td>{task.expectedDuration}h</td>
              <td>
                {task.delayDays ? (
                  <span className="ai-studio-delay-value">{task.delayDays}d</span>
                ) : (
                  <span className="ai-studio-no-delay">—</span>
                )}
              </td>
              <td>
                {task.delayDays ? (
                  task.delayJustified ? (
                    <span className="ai-studio-justified yes" title={task.justificationSource}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  ) : (
                    <span className="ai-studio-justified no">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )
                ) : (
                  <span className="ai-studio-no-delay">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
