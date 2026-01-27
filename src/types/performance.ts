// Employee Performance Monitoring Types

export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  assignedBy: string;
  deadline: number; // timestamp
  completedAt?: number; // timestamp when marked complete
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimatedHours?: number;
  actualHours?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface EmployeeChatMessage {
  id: string;
  employeeId: string;
  content: string;
  timestamp: number;
  chatType: 'internal' | 'external' | 'team';
  participantIds: string[];
  participantNames?: string[];
}

export interface VoiceTranscript {
  id: string;
  employeeId: string;
  transcript: string;
  duration: number; // seconds
  timestamp: number;
  participants: string[];
}

export interface PerformanceAnalysis {
  id: string;
  employeeId: string;
  employeeName: string;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    onTimeDeliveryRate: number; // percentage 0-100
  };
  taskAnalysis: TaskAnalysisItem[];
  conversationSummary: ConversationSummary;
  timeMetrics: TimeMetrics;
  performanceScore: number; // 0-100
  performanceLevel: PerformanceLevel;
  flags: PerformanceFlag[];
  recommendations: string[];
  generatedAt: number;
}

export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'below_average' | 'poor';

export interface TaskAnalysisItem {
  taskId: string;
  taskTitle: string;
  priority: Task['priority'];
  deadline: number;
  completedAt?: number;
  status: Task['status'];
  expectedDuration: number; // hours, estimated by Gemini
  actualDuration?: number; // hours
  deliveredOnTime: boolean;
  delayDays?: number;
  delayJustified: boolean;
  justificationSource?: string; // reference to chat message explaining delay
}

export interface ConversationSummary {
  totalMessages: number;
  workRelatedMessages: number;
  nonWorkRelatedMessages: number;
  workRelatedPercentage: number;
  topicsDiscussed: DiscussionTopic[];
  summaryText: string;
  estimatedChatTime: number; // minutes
  meetingTime: number; // minutes
}

export interface DiscussionTopic {
  topic: string;
  category: 'work' | 'personal' | 'administrative' | 'social';
  messageCount: number;
  relevantTaskIds?: string[];
}

export interface TimeMetrics {
  totalWorkHours: number;
  productiveHours: number;
  communicationHours: number;
  averageTaskCompletionTime: number; // hours
  averageDelayDays: number;
}

export interface PerformanceFlag {
  id: string;
  type: 'delay' | 'low_productivity' | 'excessive_chat' | 'missed_deadline' | 'pattern_detected' | 'unjustified_delay';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  timestamp: number;
  taskId?: string;
}

export interface PerformanceNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'delay_warning' | 'deadline_missed' | 'low_performance' | 'pattern_alert' | 'analysis_complete';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: number;
  relatedAnalysisId?: string;
  relatedTaskId?: string;
}

export interface PerformanceDashboardSummary {
  totalEmployees: number;
  averagePerformanceScore: number;
  employeesByLevel: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
    poor: number;
  };
  totalActiveFlags: number;
  recentNotifications: PerformanceNotification[];
  topPerformers: { employeeId: string; name: string; score: number }[];
  needsAttention: { employeeId: string; name: string; score: number; flagCount: number }[];
}

// Date range for analysis
export interface DateRange {
  start: number;
  end: number;
}

// View modes for the Performance Monitor
export type PerformanceViewMode = 'dashboard' | 'employee' | 'report';
