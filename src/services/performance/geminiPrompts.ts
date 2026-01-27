// Gemini prompts for Employee Performance Analysis
// All scoring rules, thresholds, and formulas are defined in the Work Analyzer bot's system prompt
// These prompts send raw data only - the AI calculates scores based on system prompt configuration

import type { Task, EmployeeChatMessage } from '../../types/performance';

/**
 * Prompt for summarizing employee conversations and extracting topics
 */
export function getConversationSummaryPrompt(
  employeeName: string,
  tasks: Task[],
  messages: EmployeeChatMessage[],
  startDate: Date,
  endDate: Date
): string {
  const tasksList = tasks.map(t =>
    `- [${t.id}] "${t.title}" (${t.priority} priority, status: ${t.status})`
  ).join('\n');

  const messagesList = messages.map(m =>
    `[${new Date(m.timestamp).toLocaleDateString()}] ${m.content}`
  ).join('\n');

  return `Analyze the following employee chat messages and provide a productivity summary.

Employee: ${employeeName}
Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

Tasks assigned to this employee:
${tasksList || 'No tasks assigned'}

Chat messages:
${messagesList || 'No messages found'}

Based on your system prompt rules for work vs non-work classification, respond with:
{
  "summaryText": "Brief summary of conversations (2-3 sentences)",
  "topics": [
    {
      "topic": "Topic name",
      "category": "work|personal|administrative|social",
      "messageCount": 3,
      "relevantTaskIds": ["task-001"]
    }
  ],
  "workRelatedPercentage": 75,
  "totalMessages": 10,
  "workRelatedMessages": 7
}`;
}

/**
 * Prompt for estimating task duration
 */
export function getTaskDurationPrompt(task: Task): string {
  return `Estimate the typical completion time for this task.

Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Tags: ${task.tags?.join(', ') || 'none'}

Use your system prompt rules for task duration estimation.

Respond with:
{
  "estimatedHours": 16,
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation"
}`;
}

/**
 * Prompt for checking if a delay was justified in conversations
 */
export function getDelayJustificationPrompt(
  task: Task,
  delayDays: number,
  relevantMessages: EmployeeChatMessage[]
): string {
  const messagesList = relevantMessages.map(m =>
    `[${new Date(m.timestamp).toLocaleDateString()}] ${m.content}`
  ).join('\n');

  return `Analyze whether this task delay was justified based on employee communications.

Task: ${task.title}
Original Deadline: ${new Date(task.deadline).toLocaleDateString()}
Actual Completion: ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Not completed'}
Delay: ${delayDays} days

Employee's chat messages during this period:
${messagesList || 'No messages found'}

Use your system prompt rules for delay justification (legitimacy score threshold, valid categories).

Respond with:
{
  "delayMentioned": true,
  "justificationProvided": true,
  "justificationText": "Explanation found in messages",
  "justificationCategory": "technical_issue|dependency_blocked|scope_change|personal|unclear|none",
  "legitimacyScore": 7
}`;
}

/**
 * Prompt for calculating overall performance score
 * Sends RAW DATA only - AI calculates scores using system prompt formulas
 */
export function getPerformanceScorePrompt(
  employeeName: string,
  metrics: {
    resultsDelivery: {
      totalTasks: number;
      completedTasks: number;
      highPriorityTotal: number;
      highPriorityCompleted: number;
    };
    communicationEfficiency: {
      totalMessages: number;
      workRelatedMessages: number;
    };
    timeManagement: {
      totalTasks: number;
      onTimeTasks: number;
      delayedTasks: Array<{
        taskTitle: string;
        delayDays: number;
        justified: boolean;
      }>;
    };
    flags: Array<{
      severity: 'critical' | 'warning' | 'info';
      title: string;
    }>;
  }
): string {
  const delayDetails = metrics.timeManagement.delayedTasks.length > 0
    ? metrics.timeManagement.delayedTasks.map(d =>
        `- "${d.taskTitle}": ${d.delayDays} days delay, justified: ${d.justified}`
      ).join('\n')
    : 'None';

  const flagDetails = metrics.flags.length > 0
    ? metrics.flags.map(f => `- [${f.severity}] ${f.title}`).join('\n')
    : 'None';

  return `Calculate the performance score for this employee using your system prompt scoring rules.

Employee: ${employeeName}

=== RAW DATA ===

RESULTS DELIVERY:
- Total Tasks: ${metrics.resultsDelivery.totalTasks}
- Completed Tasks: ${metrics.resultsDelivery.completedTasks}
- High/Urgent Priority Tasks: ${metrics.resultsDelivery.highPriorityTotal}
- High/Urgent Priority Completed: ${metrics.resultsDelivery.highPriorityCompleted}

COMMUNICATION:
- Total Messages: ${metrics.communicationEfficiency.totalMessages}
- Work-Related Messages: ${metrics.communicationEfficiency.workRelatedMessages}

TIME MANAGEMENT:
- Total Tasks: ${metrics.timeManagement.totalTasks}
- Delivered On Time: ${metrics.timeManagement.onTimeTasks}
- Delayed Tasks:
${delayDetails}

FLAGS GENERATED:
${flagDetails}

=== YOUR TASK ===
1. Calculate each category score using your system prompt formulas
2. Calculate weighted final score
3. Determine performance level
4. Generate 1-3 specific recommendations based on lowest scoring areas

Respond with:
{
  "score": 72,
  "level": "average",
  "breakdown": {
    "resultsDelivery": 80,
    "communicationEfficiency": 65,
    "timeManagement": 70,
    "consistency": 75
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ]
}`;
}

/**
 * Prompt for generating flags based on analysis data
 * AI decides which flags to generate based on system prompt thresholds
 */
export function getFlagGenerationPrompt(
  employeeName: string,
  data: {
    tasks: Array<{
      id: string;
      title: string;
      priority: string;
      deadline: number;
      completedAt?: number;
      status: string;
      delayDays?: number;
      delayJustified?: boolean;
    }>;
    conversationSummary: {
      totalMessages: number;
      workRelatedMessages: number;
      workRelatedPercentage: number;
    };
  }
): string {
  const taskDetails = data.tasks.map(t => {
    const deadlineStr = new Date(t.deadline).toLocaleDateString();
    const completedStr = t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'Not completed';
    const delayStr = t.delayDays ? `, delayed ${t.delayDays} days (justified: ${t.delayJustified})` : '';
    return `- [${t.id}] "${t.title}" (${t.priority}) - deadline: ${deadlineStr}, completed: ${completedStr}, status: ${t.status}${delayStr}`;
  }).join('\n');

  const completedCount = data.tasks.filter(t => t.status === 'completed').length;
  const totalCount = data.tasks.length;

  return `Generate performance flags for this employee based on your system prompt flag rules.

Employee: ${employeeName}
Today's Date: ${new Date().toLocaleDateString()}

TASK DATA:
${taskDetails}

Summary:
- Total tasks: ${totalCount}
- Completed tasks: ${completedCount}
- Completion rate: ${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100}%

COMMUNICATION DATA:
- Total messages: ${data.conversationSummary.totalMessages}
- Work-related messages: ${data.conversationSummary.workRelatedMessages}
- Work-related percentage: ${data.conversationSummary.workRelatedPercentage}%

Use your system prompt rules to determine which flags (critical/warning) should be generated.

Respond with:
{
  "flags": [
    {
      "type": "missed_deadline|unjustified_delay|excessive_chat|low_productivity",
      "severity": "critical|warning",
      "title": "Short flag title",
      "description": "Detailed description of the issue",
      "evidence": ["Specific fact 1", "Specific fact 2"],
      "taskId": "optional task ID if applicable"
    }
  ]
}`;
}

/**
 * Prompt for detecting behavioral patterns
 */
export function getPatternDetectionPrompt(
  employeeName: string,
  taskHistory: string,
  chatPatterns: string
): string {
  return `Analyze this employee's data to detect behavioral patterns.

Employee: ${employeeName}

Task History:
${taskHistory}

Chat Patterns:
${chatPatterns}

Use your system prompt rules for pattern detection.

Respond with:
{
  "patternsDetected": [
    {
      "type": "recurring_delay|productivity_fluctuation|communication_change|trend|busy_not_productive",
      "description": "Pattern description",
      "severity": "info|warning|critical",
      "evidence": ["Evidence 1", "Evidence 2"]
    }
  ],
  "overallTrend": "improving|stable|declining",
  "riskLevel": "low|medium|high"
}`;
}

/**
 * Prompt for generating final report summary
 */
export function getReportSummaryPrompt(
  employeeName: string,
  score: number,
  level: string,
  completedTasks: number,
  totalTasks: number,
  onTimeRate: number,
  workChatPercent: number,
  flagCount: number
): string {
  return `Generate a brief, professional performance report summary.

Employee: ${employeeName}
Performance Score: ${score}/100 (${level})
Tasks: ${completedTasks}/${totalTasks} completed
On-Time Delivery: ${onTimeRate}%
Work-Related Communication: ${workChatPercent}%
Issues Flagged: ${flagCount}

Write 2-3 sentences summarizing this employee's performance. Be direct and factual.

Respond with:
{
  "summary": "Your summary text here",
  "highlight": "Key positive point",
  "concern": "Main concern if any, or null"
}`;
}
