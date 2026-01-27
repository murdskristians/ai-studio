import { useState, useCallback, useMemo, ReactNode } from 'react';
import type {
  Employee,
  Task,
  EmployeeChatMessage,
  PerformanceAnalysis,
  PerformanceNotification,
  DateRange,
  PerformanceViewMode,
} from '../types/performance';
import { PerformanceContext, type PerformanceState } from './PerformanceContextDef';
import { PerformanceAnalyzer } from '../services/performance/performanceAnalyzer';
import { performanceApi } from '../services/api/api';
import { useUserId } from './useUser';
import { useApp } from './useApp';
import {
  getAllEmployees,
  getEmployeeTasks,
  getEmployeeMessages,
  getNotifications,
} from '../services/performance/mockData';

// Default date range: last 7 days
const getDefaultDateRange = (): DateRange => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  return { start: sevenDaysAgo, end: now };
};

interface PerformanceProviderProps {
  readonly children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  // Get real userId and bots from context
  const userId = useUserId();
  const { bots } = useApp();

  // Data state
  const [employees] = useState<Employee[]>(() => getAllEmployees());
  const [selectedEmployee, setSelectedEmployeeState] = useState<Employee | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [employeeMessages, setEmployeeMessages] = useState<EmployeeChatMessage[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [notifications, setNotifications] = useState<PerformanceNotification[]>(() => getNotifications());

  // Loading states
  const [isLoadingEmployees] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  // UI state
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [viewMode, setViewMode] = useState<PerformanceViewMode>('dashboard');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Create analyzer instance (uses backend API, no key needed)
  const analyzer = useMemo(() => new PerformanceAnalyzer(), []);

  // Select employee and load their data
  const setSelectedEmployee = useCallback((employee: Employee | null) => {
    setSelectedEmployeeState(employee);
    setCurrentAnalysis(null);
    if (employee) {
      setViewMode('employee');
    }
  }, []);

  // Load employee data (tasks and messages)
  const loadEmployeeData = useCallback(async (employeeId: string) => {
    setIsLoadingAnalysis(true);
    try {
      // Using mock data - replace with real API calls later
      const tasks = getEmployeeTasks(employeeId, dateRange.start, dateRange.end);
      const messages = getEmployeeMessages(employeeId, dateRange.start, dateRange.end);

      setEmployeeTasks(tasks);
      setEmployeeMessages(messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee data');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [dateRange]);

  // Run performance analysis
  const runAnalysis = useCallback(async (): Promise<PerformanceAnalysis | null> => {
    if (!selectedEmployee) {
      setError('No employee selected');
      return null;
    }

    if (!userId) {
      setError('User not logged in');
      return null;
    }

    // Get the selected bot or show error if none selected
    const botToUse = selectedBotId ? bots.find(b => b.id === selectedBotId) : null;
    if (!botToUse) {
      setError('Please select a bot for analysis.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress('Analyzing...');

    try {
      // Create a chat session for this analysis using real userId and existing bot
      const chat = await performanceApi.createAnalysisChat(botToUse.id, selectedEmployee.name, userId);

      // Set the context on the analyzer
      analyzer.setContext(botToUse.id, chat._id);

      // Load fresh data
      const tasks = getEmployeeTasks(selectedEmployee.id, dateRange.start, dateRange.end);
      const messages = getEmployeeMessages(selectedEmployee.id, dateRange.start, dateRange.end);

      setEmployeeTasks(tasks);
      setEmployeeMessages(messages);

      // Run the full analysis
      const analysis = await analyzer.analyzeEmployee(
        selectedEmployee,
        tasks,
        messages,
        new Date(dateRange.start),
        new Date(dateRange.end)
      );

      setCurrentAnalysis(analysis);
      setViewMode('report');
      setAnalysisProgress('');

      // Add notification for the analysis
      const newNotification: PerformanceNotification = {
        id: `notif-${Date.now()}`,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        type: 'analysis_complete',
        title: 'Analysis Complete',
        message: `Performance analysis for ${selectedEmployee.name}: Score ${analysis.performanceScore}/100 (${analysis.performanceLevel})`,
        severity: analysis.performanceScore >= 75 ? 'info' : analysis.performanceScore >= 50 ? 'warning' : 'critical',
        read: false,
        createdAt: Date.now(),
        relatedAnalysisId: analysis.id,
      };
      setNotifications(prev => [newNotification, ...prev]);

      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setAnalysisProgress('');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedEmployee, dateRange, analyzer, userId, bots, selectedBotId]);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Clear/remove a notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear current analysis
  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setViewMode('employee');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const contextValue: PerformanceState = useMemo(
    () => ({
      // Data
      employees,
      selectedEmployee,
      employeeTasks,
      employeeMessages,
      currentAnalysis,
      notifications,

      // Bot selection
      availableBots: bots,
      selectedBotId,
      setSelectedBotId,

      // Loading states
      isLoadingEmployees,
      isLoadingAnalysis,
      isAnalyzing,
      analysisProgress,

      // Actions
      setSelectedEmployee,
      loadEmployeeData,
      runAnalysis,
      markNotificationRead,
      clearNotification,
      clearAnalysis,

      // UI state
      dateRange,
      setDateRange,
      viewMode,
      setViewMode,

      // Error
      error,
      clearError,
    }),
    [
      employees,
      selectedEmployee,
      employeeTasks,
      employeeMessages,
      currentAnalysis,
      notifications,
      bots,
      selectedBotId,
      isLoadingEmployees,
      isLoadingAnalysis,
      isAnalyzing,
      analysisProgress,
      setSelectedEmployee,
      loadEmployeeData,
      runAnalysis,
      markNotificationRead,
      clearNotification,
      clearAnalysis,
      dateRange,
      viewMode,
      error,
      clearError,
    ]
  );

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}
