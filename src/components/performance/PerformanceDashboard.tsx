import { useState, useMemo } from 'react';
import { usePerformance } from '../../contexts/usePerformance';
import { mockTasks, mockChatMessages } from '../../services/performance/mockData';
import { StatsDetailModal, type StatsDetailType } from './StatsDetailModal';
import './PerformanceDashboard.css';

export function PerformanceDashboard() {
  const { employees, notifications, setSelectedEmployee, setViewMode, dateRange } = usePerformance();
  const [modalType, setModalType] = useState<StatsDetailType | null>(null);

  // Filter data by date range
  const filteredData = useMemo(() => {
    const filteredTasks = mockTasks.filter(t =>
      t.createdAt >= dateRange.start && t.createdAt <= dateRange.end
    );
    const filteredMessages = mockChatMessages.filter(m =>
      m.timestamp >= dateRange.start && m.timestamp <= dateRange.end
    );
    return { tasks: filteredTasks, messages: filteredMessages };
  }, [dateRange]);

  // Calculate task statistics from filtered data
  const taskStats = {
    total: filteredData.tasks.length,
    active: filteredData.tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length,
    overdue: filteredData.tasks.filter(t => t.status === 'overdue').length,
  };

  // Calculate message statistics
  // Note: For accurate work vs non-work detection, run the full AI analysis
  // This is a simplified client-side approximation for dashboard display
  // The actual categorization rules are defined in the Work Analyzer bot's system prompt
  const messageStats = {
    total: filteredData.messages.length,
    // Dashboard shows total only - detailed breakdown requires AI analysis
    workRelated: filteredData.messages.length,
    nonWorkRelated: 0,
  };

  // Mock dashboard summary - in real app, this would come from context/API
  const dashboardSummary = {
    totalEmployees: employees.length,
    averagePerformanceScore: 68,
    recentFlags: notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').length,
  };

  const handleEmployeeClick = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setViewMode('employee');
    }
  };

  return (
    <div className="ai-studio-performance-dashboard">
      <h2>Performance Overview</h2>

      {/* Summary Cards - Row 1: Employees */}
      <div className="ai-studio-dashboard-cards">
        <div className="ai-studio-dashboard-card">
          <div className="ai-studio-dashboard-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="ai-studio-dashboard-card-content">
            <span className="ai-studio-dashboard-card-value">{dashboardSummary.totalEmployees}</span>
            <span className="ai-studio-dashboard-card-label">Total Employees</span>
          </div>
        </div>

        <div className="ai-studio-dashboard-card">
          <div className="ai-studio-dashboard-card-icon score">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="ai-studio-dashboard-card-content">
            <span className="ai-studio-dashboard-card-value">{dashboardSummary.averagePerformanceScore}</span>
            <span className="ai-studio-dashboard-card-label">Avg. Score</span>
          </div>
        </div>

        <div className="ai-studio-dashboard-card">
          <div className="ai-studio-dashboard-card-icon alerts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="ai-studio-dashboard-card-content">
            <span className="ai-studio-dashboard-card-value">{dashboardSummary.recentFlags}</span>
            <span className="ai-studio-dashboard-card-label">Active Alerts</span>
          </div>
        </div>
      </div>

      {/* Summary Cards - Row 2: Messages */}
      <div className="ai-studio-dashboard-cards">
        <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('all-messages')}>
          <div className="ai-studio-dashboard-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="ai-studio-dashboard-card-content">
            <span className="ai-studio-dashboard-card-value">{messageStats.total}</span>
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
            <span className="ai-studio-dashboard-card-value">{messageStats.workRelated}</span>
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
            <span className="ai-studio-dashboard-card-value">{messageStats.nonWorkRelated}</span>
            <span className="ai-studio-dashboard-card-label">Non-Work</span>
          </div>
        </div>
      </div>

      {/* Summary Cards - Row 3: Tasks */}
      <div className="ai-studio-dashboard-cards">
        <div className="ai-studio-dashboard-card clickable" onClick={() => setModalType('all-tasks')}>
          <div className="ai-studio-dashboard-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="ai-studio-dashboard-card-content">
            <span className="ai-studio-dashboard-card-value">{taskStats.total}</span>
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
            <span className="ai-studio-dashboard-card-value">{taskStats.active}</span>
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
            <span className="ai-studio-dashboard-card-value">{taskStats.overdue}</span>
            <span className="ai-studio-dashboard-card-label">Overdue Tasks</span>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="ai-studio-dashboard-section">
        <h3>Employees</h3>
        <p className="ai-studio-dashboard-hint">Select an employee and run analysis to see their performance report.</p>

        <div className="ai-studio-dashboard-employee-grid">
          {employees.map(employee => (
            <div
              key={employee.id}
              className="ai-studio-dashboard-employee-card"
              onClick={() => handleEmployeeClick(employee.id)}
            >
              <div className="ai-studio-dashboard-employee-avatar">
                {employee.name.charAt(0)}
              </div>
              <div className="ai-studio-dashboard-employee-info">
                <span className="ai-studio-dashboard-employee-name">{employee.name}</span>
                <span className="ai-studio-dashboard-employee-role">{employee.role}</span>
                <span className="ai-studio-dashboard-employee-dept">{employee.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="ai-studio-dashboard-section">
          <h3>Recent Alerts</h3>
          <div className="ai-studio-dashboard-alerts">
            {notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`ai-studio-dashboard-alert ${notification.severity}`}
              >
                <div className="ai-studio-dashboard-alert-icon">
                  {notification.severity === 'critical' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {notification.severity === 'warning' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                  {notification.severity === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  )}
                </div>
                <div className="ai-studio-dashboard-alert-content">
                  <span className="ai-studio-dashboard-alert-title">{notification.title}</span>
                  <span className="ai-studio-dashboard-alert-message">{notification.message}</span>
                  <span className="ai-studio-dashboard-alert-employee">{notification.employeeName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Detail Modal */}
      {modalType && (
        <StatsDetailModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          type={modalType}
          tasks={filteredData.tasks}
          messages={filteredData.messages}
        />
      )}
    </div>
  );
}
