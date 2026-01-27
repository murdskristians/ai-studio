// Performance Analyzer Service
// Orchestrates Gemini AI analysis for employee performance via backend API
// All scoring rules and thresholds are defined in the Work Analyzer bot's system prompt

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
  getFlagGenerationPrompt,
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

interface FlagGenerationResponse {
  flags: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    evidence?: string[];
    taskId?: string;
  }>;
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
    } catch {
      console.error('Failed to parse JSON response:', text);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Analyze employee conversations to get summary and topics
   * AI determines work vs non-work based on system prompt rules
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

    return {
      totalMessages: parsed.totalMessages || messages.length,
      workRelatedMessages: parsed.workRelatedMessages || 0,
      nonWorkRelatedMessages: (parsed.totalMessages || messages.length) - (parsed.workRelatedMessages || 0),
      workRelatedPercentage: parsed.workRelatedPercentage || 0,
      topicsDiscussed: parsed.topics || [],
      summaryText: parsed.summaryText || 'Analysis complete.',
      estimatedChatTime: messages.length, // AI can adjust this based on system prompt
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
   * AI determines justification based on system prompt threshold (legitimacyScore)
   */
  async checkDelayJustification(
    task: Task,
    delayDays: number,
    messages: EmployeeChatMessage[]
  ): Promise<{ justified: boolean; justificationText?: string; legitimacyScore: number }> {
    if (messages.length === 0) {
      return { justified: false, legitimacyScore: 0 };
    }

    const prompt = getDelayJustificationPrompt(task, delayDays, messages);
    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<DelayJustificationResponse>(response);

    // AI's legitimacyScore is evaluated against system prompt threshold
    // We pass the score back so AI can make the final determination
    return {
      justified: parsed.justificationProvided && parsed.legitimacyScore >= 6, // Threshold from system prompt
      justificationText: parsed.justificationText || undefined,
      legitimacyScore: parsed.legitimacyScore,
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
        // Get messages around the deadline period
        // The buffer window can be adjusted via system prompt
        const relevantMessages = messages.filter(m => {
          const msgDate = m.timestamp;
          const deadlineBuffer = 3 * 24 * 60 * 60 * 1000; // 3 days - configurable in system prompt
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
   * Generate performance flags using AI
   * AI applies flag rules from system prompt
   */
  async generateFlags(
    employee: Employee,
    taskAnalysis: TaskAnalysisItem[],
    conversationSummary: ConversationSummary
  ): Promise<PerformanceFlag[]> {
    const prompt = getFlagGenerationPrompt(employee.name, {
      tasks: taskAnalysis.map(t => ({
        id: t.taskId,
        title: t.taskTitle,
        priority: t.priority,
        deadline: t.deadline,
        completedAt: t.completedAt,
        status: t.status,
        delayDays: t.delayDays,
        delayJustified: t.delayJustified,
      })),
      conversationSummary: {
        totalMessages: conversationSummary.totalMessages,
        workRelatedMessages: conversationSummary.workRelatedMessages,
        workRelatedPercentage: conversationSummary.workRelatedPercentage,
      },
    });

    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<FlagGenerationResponse>(response);

    const now = Date.now();
    return (parsed.flags || []).map((f, index) => ({
      id: `flag-${Date.now()}-${index}`,
      type: f.type,
      severity: f.severity,
      title: f.title,
      description: f.description,
      evidence: f.evidence || [],
      timestamp: now,
      taskId: f.taskId,
    }));
  }

  /**
   * Calculate performance score using Gemini
   * AI applies scoring formulas from system prompt
   */
  async calculatePerformanceScore(
    employee: Employee,
    taskAnalysis: TaskAnalysisItem[],
    conversationSummary: ConversationSummary,
    flags: PerformanceFlag[]
  ): Promise<{ score: number; level: PerformanceLevel; recommendations: string[] }> {
    // Gather raw data - AI will calculate scores using system prompt formulas
    const totalTasks = taskAnalysis.length;
    const completedTasks = taskAnalysis.filter(t => t.status === 'completed').length;
    const highPriorityTotal = taskAnalysis.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const highPriorityCompleted = taskAnalysis.filter(
      t => t.status === 'completed' && (t.priority === 'urgent' || t.priority === 'high')
    ).length;
    const onTimeTasks = taskAnalysis.filter(t => t.deliveredOnTime).length;
    const delayedTasks = taskAnalysis
      .filter(t => t.delayDays && t.delayDays > 0)
      .map(t => ({
        taskTitle: t.taskTitle,
        delayDays: t.delayDays || 0,
        justified: t.delayJustified || false,
      }));

    const prompt = getPerformanceScorePrompt(employee.name, {
      resultsDelivery: {
        totalTasks,
        completedTasks,
        highPriorityTotal,
        highPriorityCompleted,
      },
      communicationEfficiency: {
        totalMessages: conversationSummary.totalMessages,
        workRelatedMessages: conversationSummary.workRelatedMessages,
      },
      timeManagement: {
        totalTasks,
        onTimeTasks,
        delayedTasks,
      },
      flags: flags.map(f => ({
        severity: f.severity,
        title: f.title,
      })),
    });

    const response = await this.generateContent(prompt);
    const parsed = this.parseJsonResponse<PerformanceScoreResponse>(response);

    // Log for debugging
    console.log('=== PERFORMANCE SCORE ANALYSIS ===');
    console.log('Employee:', employee.name);
    console.log('Raw data sent to AI:', {
      resultsDelivery: { totalTasks, completedTasks, highPriorityTotal, highPriorityCompleted },
      communication: { total: conversationSummary.totalMessages, workRelated: conversationSummary.workRelatedMessages },
      timeManagement: { totalTasks, onTimeTasks, delayedCount: delayedTasks.length },
      flags: flags.length,
    });
    console.log('AI Response:', parsed);
    console.log('===================================');

    return {
      score: parsed.score || 50,
      level: parsed.level || 'average',
      recommendations: parsed.recommendations || [],
    };
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
    // Step 1: Analyze conversations (AI categorizes work vs non-work)
    const conversationSummary = await this.analyzeConversations(
      employee,
      tasks,
      messages,
      startDate,
      endDate
    );

    // Step 2: Analyze tasks performance
    const taskAnalysis = await this.analyzeTasksPerformance(tasks, messages);

    // Step 3: Generate flags (AI applies rules from system prompt)
    const flags = await this.generateFlags(employee, taskAnalysis, conversationSummary);

    // Step 4: Calculate time metrics
    const timeMetrics = this.calculateTimeMetrics(taskAnalysis, conversationSummary);

    // Step 5: Calculate performance score (AI applies formulas from system prompt)
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
