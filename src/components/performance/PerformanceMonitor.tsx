import { useEffect, useMemo, useState } from 'react';
import { usePerformance } from '../../contexts/usePerformance';
import { EmployeeSelector } from './EmployeeSelector';
import { PerformanceDashboard } from './PerformanceDashboard';
import { PerformanceReport } from './PerformanceReport';
import { NotificationPanel } from './NotificationPanel';
import { DateRangePicker, DateRangeModal } from './DateRangePicker';
import { StatsDetailModal, type StatsDetailType } from './StatsDetailModal';
import { mockTasks, mockChatMessages, getTaskById } from '../../services/performance/mockData';
import type { Task, PerformanceNotification } from '../../types/performance';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  readonly onBack: () => void;
}

export function PerformanceMonitor({ onBack }: PerformanceMonitorProps) {
  const {
    selectedEmployee,
    setSelectedEmployee,
    viewMode,
    setViewMode,
    loadEmployeeData,
    runAnalysis,
    isAnalyzing,
    analysisProgress,
    currentAnalysis,
    error,
    clearError,
    dateRange,
    setDateRange,
    notifications,
    markNotificationRead,
    clearNotification,
    availableBots,
    selectedBotId,
    setSelectedBotId,
  } = usePerformance();

  // Load employee data when selected
  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeData(selectedEmployee.id);
    }
  }, [selectedEmployee, loadEmployeeData, dateRange]);

  const handleRunAnalysis = async () => {
    if (!selectedBotId) {
      setHighlightBotSelector(true);
      return;
    }
    await runAnalysis();
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const [modalType, setModalType] = useState<StatsDetailType | null>(null);

  // State for notification task modal
  const [notificationTask, setNotificationTask] = useState<Task | null>(null);
  const [notificationModalTitle, setNotificationModalTitle] = useState<string>('');

  // State for custom date range modal
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // State for highlighting bot selector when not selected
  const [highlightBotSelector, setHighlightBotSelector] = useState(false);

  // Handle notification click to open task modal
  const handleNotificationClick = (notification: PerformanceNotification) => {
    if (notification.relatedTaskId) {
      const task = getTaskById(notification.relatedTaskId);
      if (task) {
        setNotificationTask(task);
        setNotificationModalTitle(`${notification.employeeName} - ${task.title}`);
      }
    }
  };

  const closeNotificationModal = () => {
    setNotificationTask(null);
    setNotificationModalTitle('');
  };

  // Filter employee data by date range
  const filteredEmployeeData = useMemo(() => {
    if (!selectedEmployee) return { tasks: [], messages: [] };

    const filteredTasks = mockTasks.filter(t =>
      t.assignedTo === selectedEmployee.id &&
      t.createdAt >= dateRange.start &&
      t.createdAt <= dateRange.end
    );
    const filteredMessages = mockChatMessages.filter(m =>
      m.employeeId === selectedEmployee.id &&
      m.timestamp >= dateRange.start &&
      m.timestamp <= dateRange.end
    );

    return { tasks: filteredTasks, messages: filteredMessages };
  }, [selectedEmployee, dateRange]);

  // Calculate employee-specific statistics from filtered data
  const employeeStats = useMemo(() => {
    if (!selectedEmployee) return null;

    const nonWorkKeywords = ['game', 'lunch', 'funny', 'video', 'marvel', 'trailer', 'watch'];

    return {
      tasks: {
        total: filteredEmployeeData.tasks.length,
        active: filteredEmployeeData.tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length,
        overdue: filteredEmployeeData.tasks.filter(t => t.status === 'overdue').length,
      },
      messages: {
        total: filteredEmployeeData.messages.length,
        workRelated: filteredEmployeeData.messages.filter(m =>
          !nonWorkKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
        ).length,
        nonWorkRelated: filteredEmployeeData.messages.filter(m =>
          nonWorkKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
        ).length,
      },
    };
  }, [selectedEmployee, filteredEmployeeData]);

  return (
    <div className="ai-studio-performance-monitor">
      {/* Header */}
      <header className="ai-studio-performance-header">
        <div className="ai-studio-performance-header-left">
          <button
            className="ai-studio-back-btn"
            onClick={onBack}
            title="Back to Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="ai-studio-performance-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Performance Monitor</span>
          </div>
        </div>

        <div className="ai-studio-performance-header-center">
          <div className="ai-studio-view-toggle">
            <button
              className={`ai-studio-view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
              onClick={() => setViewMode('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`ai-studio-view-btn ${viewMode === 'employee' ? 'active' : ''}`}
              onClick={() => setViewMode('employee')}
              disabled={!selectedEmployee}
            >
              Employee
            </button>
            <button
              className={`ai-studio-view-btn ${viewMode === 'report' ? 'active' : ''}`}
              onClick={() => setViewMode('report')}
              disabled={!currentAnalysis}
            >
              Report
            </button>
          </div>
        </div>

        <div className="ai-studio-performance-header-right">
          <DateRangePicker
            onShowCustomChange={setShowCustomDateRange}
            disabled={viewMode === 'report'}
            disabledTooltip="Date selection is not available in Report view"
          />
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="ai-studio-performance-error">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="ai-studio-performance-content">
        {/* Sidebar */}
        <aside className="ai-studio-performance-sidebar">
          <EmployeeSelector
            onEmployeeSelect={setSelectedEmployee}
            selectedEmployeeId={selectedEmployee?.id || null}
          />
        </aside>

        {/* Main View */}
        <main className="ai-studio-performance-main">
          {viewMode === 'dashboard' && <PerformanceDashboard />}
          {viewMode === 'employee' && selectedEmployee && (
            <div className="ai-studio-employee-view">
              <div className="ai-studio-employee-header">
                <div className="ai-studio-employee-avatar">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="ai-studio-employee-info">
                  <h2>{selectedEmployee.name}</h2>
                  <p>{selectedEmployee.role} • {selectedEmployee.department}</p>
                  <p className="ai-studio-employee-email">{selectedEmployee.email}</p>
                </div>
                <button
                  className="ai-studio-analyze-btn ai-studio-analyze-btn-header"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    'Analyzing...'
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      Run Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Employee Statistics */}
              {employeeStats && (
                <div className="ai-studio-employee-stats">
                  {/* Messages Row */}
                  <div className="ai-studio-dashboard-cards">
                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('all-messages')}>
                      <div className="ai-studio-dashboard-card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.messages.total}</span>
                        <span className="ai-studio-dashboard-card-label">Total Messages</span>
                      </div>
                    </div>

                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('work-messages')}>
                      <div className="ai-studio-dashboard-card-icon score">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <path d="M8 9h8M8 13h6" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.messages.workRelated}</span>
                        <span className="ai-studio-dashboard-card-label">Work Related</span>
                      </div>
                    </div>

                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('non-work-messages')}>
                      <div className="ai-studio-dashboard-card-icon alerts">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <line x1="9" y1="10" x2="15" y2="10" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.messages.nonWorkRelated}</span>
                        <span className="ai-studio-dashboard-card-label">Non-Work</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Row */}
                  <div className="ai-studio-dashboard-cards">
                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('all-tasks')}>
                      <div className="ai-studio-dashboard-card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.tasks.total}</span>
                        <span className="ai-studio-dashboard-card-label">Total Tasks</span>
                      </div>
                    </div>

                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('active-tasks')}>
                      <div className="ai-studio-dashboard-card-icon score">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.tasks.active}</span>
                        <span className="ai-studio-dashboard-card-label">Active Tasks</span>
                      </div>
                    </div>

                    <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('overdue-tasks')}>
                      <div className="ai-studio-dashboard-card-icon alerts">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div className="ai-studio-dashboard-card-content">
                        <span className="ai-studio-dashboard-card-value">{employeeStats.tasks.overdue}</span>
                        <span className="ai-studio-dashboard-card-label">Overdue Tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isAnalyzing ? (
                <div className="ai-studio-analysis-loading">
                  <span className="ai-studio-spinner ai-studio-spinner-large" />
                  <p>{analysisProgress || 'Analyzing...'}</p>
                </div>
              ) : (
                <>
                  {/* Bot Selector */}
                  {highlightBotSelector && (
                    <div className="ai-studio-bot-selector-error">Please select an analysis bot</div>
                  )}
                  <div className="ai-studio-analysis-bot-selector">
                    <label htmlFor="analysis-bot">Analysis Bot:</label>
                    <select
                      id="analysis-bot"
                      value={selectedBotId || ''}
                      onChange={(e) => {
                        setSelectedBotId(e.target.value || null);
                        setHighlightBotSelector(false);
                      }}
                      className={`ai-studio-bot-select ${highlightBotSelector ? 'highlight-error' : ''}`}
                    >
                      <option value="">-- Select a bot --</option>
                      {availableBots.map(bot => (
                        <option key={bot.id} value={bot.id}>{bot.name}</option>
                      ))}
                    </select>
                  </div>

                  {currentAnalysis ? (
                    <div className="ai-studio-employee-summary">
                      <p>Analysis available. Switch to Report view to see details.</p>
                      <button
                        className="ai-studio-view-report-btn"
                        onClick={() => setViewMode('report')}
                      >
                        View Report
                      </button>
                    </div>
                  ) : (
                    <div className="ai-studio-employee-prompt">
                      <p>Select a bot and date range, then click "Run Analysis" to analyze this employee's performance.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {viewMode === 'employee' && !selectedEmployee && (
            <div className="ai-studio-performance-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>Select an employee from the sidebar to view their performance</p>
            </div>
          )}
          {viewMode === 'report' && currentAnalysis && (
            <PerformanceReport
              analysis={currentAnalysis}
              tasks={filteredEmployeeData.tasks}
              messages={filteredEmployeeData.messages}
            />
          )}
          {viewMode === 'report' && !currentAnalysis && (
            <div className="ai-studio-performance-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p>Run an analysis to generate a report</p>
            </div>
          )}
        </main>

        {/* Notifications Panel */}
        <aside className="ai-studio-performance-notifications">
          <div className="ai-studio-notifications-header">
            <h3>
              Notifications
              {unreadNotifications > 0 && (
                <span className="ai-studio-notification-badge">{unreadNotifications}</span>
              )}
            </h3>
          </div>
          <NotificationPanel
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onClear={clearNotification}
            onNotificationClick={handleNotificationClick}
          />
        </aside>
      </div>

      {/* Stats Detail Modal for Employee View */}
      {modalType && selectedEmployee && (
        <StatsDetailModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          type={modalType}
          tasks={filteredEmployeeData.tasks}
          messages={filteredEmployeeData.messages}
          employeeName={selectedEmployee.name}
        />
      )}

      {/* Notification Task Modal */}
      {notificationTask && (
        <StatsDetailModal
          isOpen={!!notificationTask}
          onClose={closeNotificationModal}
          type="single-task"
          tasks={[notificationTask]}
          messages={[]}
          customTitle={notificationModalTitle}
        />
      )}

      {/* Custom Date Range Modal */}
      <DateRangeModal
        isOpen={showCustomDateRange}
        onClose={() => setShowCustomDateRange(false)}
        dateRange={dateRange}
        onChange={setDateRange}
      />
    </div>
  );
}
