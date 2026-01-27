import { createContext } from 'react';
import type {
  Employee,
  Task,
  EmployeeChatMessage,
  PerformanceAnalysis,
  PerformanceNotification,
  DateRange,
  PerformanceViewMode,
} from '../types/performance';
import type { Bot } from '../types';

export interface PerformanceState {
  // Data
  employees: Employee[];
  selectedEmployee: Employee | null;
  employeeTasks: Task[];
  employeeMessages: EmployeeChatMessage[];
  currentAnalysis: PerformanceAnalysis | null;
  notifications: PerformanceNotification[];

  // Bot selection for analysis
  availableBots: Bot[];
  selectedBotId: string | null;
  setSelectedBotId: (botId: string | null) => void;

  // Loading states
  isLoadingEmployees: boolean;
  isLoadingAnalysis: boolean;
  isAnalyzing: boolean;
  analysisProgress: string;

  // Actions
  setSelectedEmployee: (employee: Employee | null) => void;
  loadEmployeeData: (employeeId: string) => Promise<void>;
  runAnalysis: () => Promise<PerformanceAnalysis | null>;
  markNotificationRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  clearAnalysis: () => void;

  // UI state
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  viewMode: PerformanceViewMode;
  setViewMode: (mode: PerformanceViewMode) => void;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const PerformanceContext = createContext<PerformanceState | null>(null);
