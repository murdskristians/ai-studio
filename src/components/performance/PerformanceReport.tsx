import { useState } from 'react';
import type { PerformanceAnalysis, Task, EmployeeChatMessage } from '../../types/performance';
import { PerformanceScoreBadge } from './PerformanceScoreBadge';
import { TaskAnalysisTable } from './TaskAnalysisTable';
import { ConversationInsights } from './ConversationInsights';
import { PerformanceFlags } from './PerformanceFlags';
import { StatsDetailModal, type StatsDetailType } from './StatsDetailModal';
import './PerformanceReport.css';

interface PerformanceReportProps {
  analysis: PerformanceAnalysis;
  tasks: Task[];
  messages: EmployeeChatMessage[];
}

export function PerformanceReport({ analysis, tasks, messages }: Readonly<PerformanceReportProps>) {
  const [modalType, setModalType] = useState<StatsDetailType | null>(null);

  const {
    employeeName,
    period,
    summary,
    performanceScore,
    performanceLevel,
    taskAnalysis,
    conversationSummary,
    timeMetrics,
    flags,
    recommendations,
    generatedAt,
  } = analysis;

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();

  return (
    <div className="ai-studio-performance-report">
      {/* Report Header */}
      <div className="ai-studio-report-header">
        <div className="ai-studio-report-header-left">
          <h2>Performance Report</h2>
          <p className="ai-studio-report-meta">
            {employeeName} • {formatDate(period.start)} - {formatDate(period.end)}
          </p>
          <p className="ai-studio-report-generated">
            Generated: {new Date(generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="ai-studio-report-header-right">
          <PerformanceScoreBadge
            score={performanceScore}
            level={performanceLevel}
            size="large"
            showLabel
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ai-studio-report-summary">
        <button
          type="button"
          className="ai-studio-report-summary-card clickable"
          onClick={() => setModalType('all-tasks')}
        >
          <span className="ai-studio-report-summary-value">{summary.totalTasks}</span>
          <span className="ai-studio-report-summary-label">Total Tasks</span>
        </button>
        <button
          type="button"
          className="ai-studio-report-summary-card success clickable"
          onClick={() => setModalType('completed-tasks')}
        >
          <span className="ai-studio-report-summary-value">{summary.completedTasks}</span>
          <span className="ai-studio-report-summary-label">Completed</span>
        </button>
        <button
          type="button"
          className="ai-studio-report-summary-card warning clickable"
          onClick={() => setModalType('active-tasks')}
        >
          <span className="ai-studio-report-summary-value">{summary.inProgressTasks}</span>
          <span className="ai-studio-report-summary-label">In Progress</span>
        </button>
        <button
          type="button"
          className="ai-studio-report-summary-card danger clickable"
          onClick={() => setModalType('overdue-tasks')}
        >
          <span className="ai-studio-report-summary-value">{summary.overdueTasks}</span>
          <span className="ai-studio-report-summary-label">Overdue</span>
        </button>
        <div className="ai-studio-report-summary-card">
          <span className="ai-studio-report-summary-value">{summary.onTimeDeliveryRate}%</span>
          <span className="ai-studio-report-summary-label">On-Time Rate</span>
        </div>
      </div>

      {/* Flags Section */}
      {flags.length > 0 && (
        <div className="ai-studio-report-section">
          <h3>Issues & Alerts</h3>
          <PerformanceFlags flags={flags} />
        </div>
      )}

      {/* Task Analysis */}
      <div className="ai-studio-report-section">
        <h3>Task Analysis</h3>
        <TaskAnalysisTable tasks={taskAnalysis} />
      </div>

      {/* Conversation Insights */}
      <div className="ai-studio-report-section">
        <h3>Communication Analysis</h3>
        <ConversationInsights summary={conversationSummary} />
      </div>

      {/* Time Metrics */}
      <div className="ai-studio-report-section">
        <h3>Time Metrics</h3>
        <div className="ai-studio-time-metrics">
          <div className="ai-studio-time-metric">
            <span className="ai-studio-time-metric-value">
              {timeMetrics.productiveHours.toFixed(1)}h
            </span>
            <span className="ai-studio-time-metric-label">Productive Hours</span>
          </div>
          <div className="ai-studio-time-metric">
            <span className="ai-studio-time-metric-value">
              {timeMetrics.communicationHours.toFixed(1)}h
            </span>
            <span className="ai-studio-time-metric-label">Communication</span>
          </div>
          <div className="ai-studio-time-metric">
            <span className="ai-studio-time-metric-value">
              {timeMetrics.averageTaskCompletionTime.toFixed(1)}h
            </span>
            <span className="ai-studio-time-metric-label">Avg. Task Time</span>
          </div>
          <div className="ai-studio-time-metric">
            <span className="ai-studio-time-metric-value">
              {timeMetrics.averageDelayDays.toFixed(1)}d
            </span>
            <span className="ai-studio-time-metric-label">Avg. Delay</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="ai-studio-report-section">
          <h3>AI Recommendations</h3>
          <ul className="ai-studio-recommendations">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Detail Modal */}
      {modalType && (
        <StatsDetailModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          type={modalType}
          tasks={tasks}
          messages={messages}
          employeeName={employeeName}
        />
      )}
    </div>
  );
}
