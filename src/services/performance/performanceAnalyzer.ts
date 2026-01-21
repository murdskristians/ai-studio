// Performance Analyzer Service
// Orchestrates Gemini AI analysis for employee performance via backend API

import { performanceApi } from '../api/api';
import type {
  Employee,
  Task,
  EmployeeChatMessage,
  PerformanceAnalysis,
  TaskAnalysisItem,
  ConversationSummary,
  TimeMetrics,
  PerformanceFlag,
  PerformanceLevel,
  DiscussionTopic,
} from '../../types/performance';
import {
  getConversationSummaryPrompt,
  getTaskDurationPrompt,
  getDelayJustificationPrompt,
  getPerformanceScorePrompt,
} from './geminiPrompts';

interface ConversationSummaryResponse {
  summaryText: string;
  topics: DiscussionTopic[];
  workRelatedPercentage: number;
  totalMessages: number;
  workRelatedMessages: number;
}

interface TaskDurationResponse {
  estimatedHours: number;
  confidence: string;
  reasoning: string;
}

interface DelayJustificationResponse {
  delayMentioned: boolean;
  justificationProvided: boolean;
  justificationText: string | null;
  justificationCategory: string;
  legitimacyScore: number;
}

interface PerformanceScoreResponse {
  score: number;
  level: PerformanceLevel;
  breakdown: {
    resultsDelivery: number;
    communicationEfficiency: number;
    timeManagement: number;
    consistency: number;
  };
  recommendations: string[];
}

export class PerformanceAnalyzer {
  private agentId: string | null = null;
  private chatId: string | null = null;

  setContext(agentId: string, chatId: string) {
    this.agentId = agentId;
    this.chatId = chatId;
  }

  private async generateContent(prompt: string): Promise<string> {
    if (!this.agentId || !this.chatId) {
      throw new Error('Analyzer context not set. Call setContext() first.');
    }
    const result = await performanceApi.analyze({
      prompt,
      agentId: this.agentId,
      chatId: this.chatId
    });
    return result.response;
  }

  private parseJsonResponse<T>(text: string): T {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', text);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Analyze employee conversations to get summary and topics
   */
  async analyzeConversations(
    employee: Employee,
    tasks: Task[],
    messages: EmployeeChatMessage[],
    startDate: Date,
    endDate: Date
  ): Promise<ConversationSummary> {
    if (messages.length === 0) {
      return {
        totalMessages: 0,
        workRelatedMessages: 0,
        nonWorkRelatedMessages: 0,
        workRelatedPercentage: 0,
        topicsDiscussed: [],
        summaryText: 'No messages found for this period.',
        estimatedChatTime: 0,
        meetingTime: 0,
      };
    }

    const prompt = getConversationSummaryPrompt(
      employee.name,
      tasks,
      messages,
      startDate,
      endDate
    );

    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<ConversationSummaryResponse>(response);

    // Estimate chat time: ~1 minute per message (reading + writing)
    const estimatedChatTime = messages.length * 1;

    return {
      totalMessages: parsed.totalMessages || messages.length,
      workRelatedMessages: parsed.workRelatedMessages || 0,
      nonWorkRelatedMessages: (parsed.totalMessages || messages.length) - (parsed.workRelatedMessages || 0),
      workRelatedPercentage: parsed.workRelatedPercentage || 0,
      topicsDiscussed: parsed.topics || [],
      summaryText: parsed.summaryText || 'Analysis complete.',
      estimatedChatTime,
      meetingTime: 0, // Will be filled when voice transcripts are available
    };
  }

  /**
   * Estimate duration for a task using Gemini
   */
  async estimateTaskDuration(task: Task): Promise<number> {
    // If task already has estimated hours, use that
    if (task.estimatedHours) {
      return task.estimatedHours;
    }

    const prompt = getTaskDurationPrompt(task);
    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<TaskDurationResponse>(response);

    return parsed.estimatedHours || 8; // Default to 8 hours if parsing fails
  }

  /**
   * Check if a delay was justified in employee communications
   */
  async checkDelayJustification(
    task: Task,
    delayDays: number,
    messages: EmployeeChatMessage[]
  ): Promise<{ justified: boolean; justificationText?: string }> {
    if (messages.length === 0) {
      return { justified: false };
    }

    const prompt = getDelayJustificationPrompt(task, delayDays, messages);
    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<DelayJustificationResponse>(response);

    // Consider justified if legitimacy score is 6 or higher
    const justified = parsed.justificationProvided && parsed.legitimacyScore >= 6;

    return {
      justified,
      justificationText: parsed.justificationText || undefined,
    };
  }

  /**
   * Analyze individual tasks and compare against chat activity
   */
  async analyzeTasksPerformance(
    tasks: Task[],
    messages: EmployeeChatMessage[]
  ): Promise<TaskAnalysisItem[]> {
    const analysisItems: TaskAnalysisItem[] = [];
    const now = Date.now();

    for (const task of tasks) {
      // Estimate expected duration
      const expectedDuration = await this.estimateTaskDuration(task);

      // Calculate actual duration if completed
      let actualDuration: number | undefined;
      if (task.completedAt && task.createdAt) {
        actualDuration = (task.completedAt - task.createdAt) / (1000 * 60 * 60); // hours
      }

      // Check if delivered on time
      let deliveredOnTime = true;
      let delayDays: number | undefined;

      if (task.status === 'completed' && task.completedAt) {
        deliveredOnTime = task.completedAt <= task.deadline;
        if (!deliveredOnTime) {
          delayDays = Math.ceil((task.completedAt - task.deadline) / (1000 * 60 * 60 * 24));
        }
      } else if (task.status === 'overdue' || (task.deadline < now && task.status !== 'completed')) {
        deliveredOnTime = false;
        delayDays = Math.ceil((now - task.deadline) / (1000 * 60 * 60 * 24));
      }

      // Check if delay was justified
      let delayJustified = true;
      let justificationSource: string | undefined;

      if (delayDays && delayDays > 0) {
        // Get messages from around the deadline period
        const relevantMessages = messages.filter(m => {
          const msgDate = m.timestamp;
          const deadlineBuffer = 3 * 24 * 60 * 60 * 1000; // 3 days before/after deadline
          return msgDate >= task.deadline - deadlineBuffer && msgDate <= (task.completedAt || now) + deadlineBuffer;
        });

        const justification = await this.checkDelayJustification(task, delayDays, relevantMessages);
        delayJustified = justification.justified;
        justificationSource = justification.justificationText;
      }

      analysisItems.push({
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        deadline: task.deadline,
        completedAt: task.completedAt,
        status: task.status,
        expectedDuration,
        actualDuration,
        deliveredOnTime,
        delayDays,
        delayJustified,
        justificationSource,
      });
    }

    return analysisItems;
  }

  /**
   * Calculate performance score using Gemini
   */
  async calculatePerformanceScore(
    employee: Employee,
    taskAnalysis: TaskAnalysisItem[],
    conversationSummary: ConversationSummary,
    flags: PerformanceFlag[]
  ): Promise<{ score: number; level: PerformanceLevel; recommendations: string[] }> {
    // === RESULTS DELIVERY METRICS (50% weight) ===
    // Focus: Did the work get done? (Completion count, not timing)
    const totalTasks = taskAnalysis.length;
    const completedTasks = taskAnalysis.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Calculate output quality based on priority of completed tasks
    const completedHighPriority = taskAnalysis.filter(
      t => t.status === 'completed' && (t.priority === 'urgent' || t.priority === 'high')
    ).length;
    const totalHighPriority = taskAnalysis.filter(
      t => t.priority === 'urgent' || t.priority === 'high'
    ).length;
    const highPriorityCompletionRate = totalHighPriority > 0
      ? completedHighPriority / totalHighPriority
      : 1;
    const taskOutputQuality = highPriorityCompletionRate >= 0.8 ? 'high'
      : highPriorityCompletionRate >= 0.5 ? 'medium' : 'low';

    // === COMMUNICATION EFFICIENCY METRICS (20% weight) ===
    // Focus: Is communication productive and work-focused?
    const workRelatedPercent = conversationSummary.workRelatedPercentage;
    const nonWorkRelatedPercent = 100 - workRelatedPercent;

    // === TIME MANAGEMENT METRICS (20% weight) ===
    // Focus: How well are deadlines handled? (Timing, delays, justifications)
    const onTimeTasks = taskAnalysis.filter(t => t.deliveredOnTime).length;
    const onTimeRate = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 100;

    const delayedTasks = taskAnalysis.filter(t => t.delayDays && t.delayDays > 0);
    const avgDelay = delayedTasks.length > 0
      ? delayedTasks.reduce((sum, t) => sum + (t.delayDays || 0), 0) / delayedTasks.length
      : 0;

    const justifiedDelays = taskAnalysis.filter(t => t.delayDays && t.delayDays > 0 && t.delayJustified).length;
    const unjustifiedDelays = taskAnalysis.filter(t => t.delayDays && t.delayDays > 0 && !t.delayJustified).length;

    // === CONSISTENCY METRICS (10% weight) ===
    // Focus: Are there recurring issues or behavioral patterns?
    const criticalFlags = flags.filter(f => f.severity === 'critical').length;
    const warningFlags = flags.filter(f => f.severity === 'warning').length;

    // Identify recurring issues (same type of flag appearing multiple times)
    const flagTypeCounts = flags.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const recurringIssues = Object.entries(flagTypeCounts)
      .filter(([, count]) => count > 1)
      .map(([type]) => type.replace('_', ' '));

    const flagDescriptions = flags.map(f => `${f.severity}: ${f.title}`);

    const prompt = getPerformanceScorePrompt(
      employee.name,
      {
        resultsDelivery: {
          totalTasks,
          completedTasks,
          completionRate,
          taskOutputQuality,
        },
        communicationEfficiency: {
          workRelatedPercent,
          nonWorkRelatedPercent,
          totalMessages: conversationSummary.totalMessages,
          chatTimeMinutes: conversationSummary.estimatedChatTime,
        },
        timeManagement: {
          onTimeDeliveryRate: onTimeRate,
          averageDelayDays: Math.round(avgDelay * 10) / 10,
          justifiedDelays,
          unjustifiedDelays,
        },
        consistency: {
          flagCount: flags.length,
          criticalFlags,
          warningFlags,
          recurringIssues,
        },
      },
      flagDescriptions
    );

    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<PerformanceScoreResponse>(response);

    // Log the score breakdown for debugging
    console.log('=== PERFORMANCE SCORE ANALYSIS ===');
    console.log('Employee:', employee.name);
    console.log('');
    console.log('--- LOCAL CALCULATIONS (sent to Gemini) ---');
    console.log('Results Delivery:', { totalTasks, completedTasks, completionRate: `${completionRate}%`, taskOutputQuality });
    console.log('Communication:', { workRelatedPercent: `${workRelatedPercent}%`, nonWorkRelatedPercent: `${nonWorkRelatedPercent}%`, totalMessages: conversationSummary.totalMessages });
    console.log('Time Management:', { onTimeRate: `${onTimeRate}%`, avgDelay: Math.round(avgDelay * 10) / 10, justifiedDelays, unjustifiedDelays });
    console.log('Consistency:', { flagCount: flags.length, criticalFlags, warningFlags, recurringIssues });
    console.log('');
    console.log('--- GEMINI API RESPONSE ---');
    console.log('Raw Response:', response);
    console.log('Parsed JSON:', parsed);
    console.log('');
    console.log('--- GEMINI SCORES ---');
    console.log('Final Score:', parsed.score, `(${parsed.level})`);
    console.log('Breakdown from Gemini:');
    console.log('  - Results Delivery (50%):', parsed.breakdown?.resultsDelivery);
    console.log('  - Communication Efficiency (20%):', parsed.breakdown?.communicationEfficiency);
    console.log('  - Time Management (20%):', parsed.breakdown?.timeManagement);
    console.log('  - Consistency (10%):', parsed.breakdown?.consistency);
    console.log('Recommendations from Gemini:', parsed.recommendations);
    console.log('===================================');

    return {
      score: parsed.score || 50,
      level: parsed.level || 'average',
      recommendations: parsed.recommendations || [],
    };
  }

  /**
   * Generate performance flags based on analysis
   */
  generateFlags(
    taskAnalysis: TaskAnalysisItem[],
    conversationSummary: ConversationSummary
  ): PerformanceFlag[] {
    const flags: PerformanceFlag[] = [];
    const now = Date.now();

    // Flag missed deadlines
    const missedDeadlines = taskAnalysis.filter(
      t => t.status === 'overdue' || (!t.deliveredOnTime && t.status !== 'completed')
    );
    missedDeadlines.forEach(task => {
      flags.push({
        id: `flag-${task.taskId}-missed`,
        type: 'missed_deadline',
        severity: task.priority === 'urgent' || task.priority === 'high' ? 'critical' : 'warning',
        title: 'Missed Deadline',
        description: `Task "${task.taskTitle}" is overdue by ${task.delayDays || 1} days`,
        evidence: [`Deadline: ${new Date(task.deadline).toLocaleDateString()}`],
        timestamp: now,
        taskId: task.taskId,
      });
    });

    // Flag unjustified delays
    const unjustifiedDelays = taskAnalysis.filter(t => t.delayDays && !t.delayJustified);
    unjustifiedDelays.forEach(task => {
      flags.push({
        id: `flag-${task.taskId}-unjustified`,
        type: 'unjustified_delay',
        severity: 'warning',
        title: 'Unjustified Delay',
        description: `Task "${task.taskTitle}" was delayed ${task.delayDays} days without explanation`,
        evidence: ['No justification found in communications'],
        timestamp: now,
        taskId: task.taskId,
      });
    });

    // Flag low work-related communication
    if (conversationSummary.workRelatedPercentage < 50 && conversationSummary.totalMessages > 5) {
      flags.push({
        id: `flag-low-work-chat`,
        type: 'excessive_chat',
        severity: 'warning',
        title: 'Low Work-Related Communication',
        description: `Only ${conversationSummary.workRelatedPercentage}% of messages are work-related`,
        evidence: [
          `${conversationSummary.workRelatedMessages} work messages out of ${conversationSummary.totalMessages} total`,
        ],
        timestamp: now,
      });
    }

    // Flag low productivity (many tasks, few completed)
    const completedCount = taskAnalysis.filter(t => t.status === 'completed').length;
    const totalCount = taskAnalysis.length;
    if (totalCount >= 3 && completedCount / totalCount < 0.3) {
      flags.push({
        id: `flag-low-productivity`,
        type: 'low_productivity',
        severity: 'critical',
        title: 'Low Task Completion Rate',
        description: `Only ${completedCount} of ${totalCount} tasks completed`,
        evidence: taskAnalysis.filter(t => t.status !== 'completed').map(t => `"${t.taskTitle}" not completed`),
        timestamp: now,
      });
    }

    return flags;
  }

  /**
   * Calculate time metrics
   */
  calculateTimeMetrics(
    taskAnalysis: TaskAnalysisItem[],
    conversationSummary: ConversationSummary
  ): TimeMetrics {
    const completedTasks = taskAnalysis.filter(t => t.actualDuration);
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasks.length
      : 0;

    const delayedTasks = taskAnalysis.filter(t => t.delayDays && t.delayDays > 0);
    const avgDelayDays = delayedTasks.length > 0
      ? delayedTasks.reduce((sum, t) => sum + (t.delayDays || 0), 0) / delayedTasks.length
      : 0;

    const communicationHours = (conversationSummary.estimatedChatTime + conversationSummary.meetingTime) / 60;
    const productiveHours = completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);

    return {
      totalWorkHours: productiveHours + communicationHours,
      productiveHours,
      communicationHours,
      averageTaskCompletionTime: avgCompletionTime,
      averageDelayDays: avgDelayDays,
    };
  }

  /**
   * Run full performance analysis for an employee
   */
  async analyzeEmployee(
    employee: Employee,
    tasks: Task[],
    messages: EmployeeChatMessage[],
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceAnalysis> {
    // Step 1: Analyze conversations
    const conversationSummary = await this.analyzeConversations(
      employee,
      tasks,
      messages,
      startDate,
      endDate
    );

    // Step 2: Analyze tasks performance
    const taskAnalysis = await this.analyzeTasksPerformance(tasks, messages);

    // Step 3: Generate flags
    const flags = this.generateFlags(taskAnalysis, conversationSummary);

    // Step 4: Calculate time metrics
    const timeMetrics = this.calculateTimeMetrics(taskAnalysis, conversationSummary);

    // Step 5: Calculate performance score
    const { score, level, recommendations } = await this.calculatePerformanceScore(
      employee,
      taskAnalysis,
      conversationSummary,
      flags
    );

    // Build summary
    const completedTasks = taskAnalysis.filter(t => t.status === 'completed').length;
    const overdueTasks = taskAnalysis.filter(t => t.status === 'overdue').length;
    const inProgressTasks = taskAnalysis.filter(t => t.status === 'in_progress').length;
    const onTimeTasks = taskAnalysis.filter(t => t.deliveredOnTime).length;
    const onTimeRate = taskAnalysis.length > 0 ? Math.round((onTimeTasks / taskAnalysis.length) * 100) : 100;

    return {
      id: `analysis-${employee.id}-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      period: {
        start: startDate.getTime(),
        end: endDate.getTime(),
      },
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        onTimeDeliveryRate: onTimeRate,
      },
      taskAnalysis,
      conversationSummary,
      timeMetrics,
      performanceScore: score,
      performanceLevel: level,
      flags,
      recommendations,
      generatedAt: Date.now(),
    };
  }
}
