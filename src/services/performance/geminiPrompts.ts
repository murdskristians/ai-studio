// Gemini prompts for Employee Performance Analysis

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

  return `You are analyzing employee chat messages to create a productivity summary.

Given the following chat messages from an employee, provide:
1. A brief summary of what was discussed (2-3 sentences)
2. The main topics categorized as: work, personal, administrative, social
3. For each work topic, identify which task IDs (if any) the discussion relates to
4. Calculate the percentage of work-related messages

Employee: ${employeeName}
Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

Tasks assigned to this employee:
${tasksList || 'No tasks assigned'}

Chat messages:
${messagesList || 'No messages found'}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "summaryText": "Brief summary of conversations",
  "topics": [
    {
      "topic": "Topic name",
      "category": "work",
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
  return `You are an expert project manager. Based on the task description below, estimate the typical time required for a competent employee to complete this task.

Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Tags: ${task.tags?.join(', ') || 'none'}

Consider:
- Standard industry practices for software development tasks
- Typical complexity for such tasks
- Buffer time for unexpected issues

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "estimatedHours": 16,
  "confidence": "high",
  "reasoning": "Brief explanation of the estimate"
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

  return `Analyze whether a task delay has been justified or explained in the employee's communications.

Task: ${task.title}
Original Deadline: ${new Date(task.deadline).toLocaleDateString()}
Actual Completion: ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Not completed'}
Delay: ${delayDays} days

Employee's chat messages during this period:
${messagesList || 'No messages found'}

Determine:
1. Was the delay mentioned or discussed?
2. Was there a legitimate reason provided (technical issues, blocked by dependencies, scope changes)?
3. What was the justification (if any)?

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "delayMentioned": true,
  "justificationProvided": true,
  "justificationText": "The employee mentioned having technical issues with the framework",
  "justificationCategory": "technical_issue",
  "legitimacyScore": 7
}

justificationCategory must be one of: technical_issue, dependency_blocked, scope_change, personal, unclear, none
legitimacyScore is 1-10, where 10 means fully justified and 1 means no justification`;
}

/**
 * Prompt for calculating overall performance score
 */
export function getPerformanceScorePrompt(
  employeeName: string,
  metrics: {
    // Results Delivery metrics (50% weight) - Focus: Did work get done?
    resultsDelivery: {
      totalTasks: number;
      completedTasks: number;
      completionRate: number; // percentage of tasks completed
      taskOutputQuality: string; // 'high', 'medium', 'low' based on priority completion
    };
    // Communication Efficiency metrics (20% weight) - Focus: Is communication productive?
    communicationEfficiency: {
      workRelatedPercent: number;
      nonWorkRelatedPercent: number;
      totalMessages: number;
      chatTimeMinutes: number;
    };
    // Time Management metrics (20% weight) - Focus: How well are deadlines handled?
    timeManagement: {
      onTimeDeliveryRate: number; // percentage delivered on time
      averageDelayDays: number;
      justifiedDelays: number;
      unjustifiedDelays: number;
    };
    // Consistency metrics (10% weight) - Focus: Are there recurring issues?
    consistency: {
      flagCount: number;
      criticalFlags: number;
      warningFlags: number;
      recurringIssues: string[];
    };
  },
  flags: string[]
): string {
  // Pre-calculate the scores using deterministic formulas
  // Results Delivery (50% weight): Based on completion rate and quality
  const qualityBonus = metrics.resultsDelivery.taskOutputQuality === 'high' ? 10 :
    metrics.resultsDelivery.taskOutputQuality === 'medium' ? 0 : -10;
  const resultsScore = Math.min(100, Math.max(0,
    metrics.resultsDelivery.completionRate + qualityBonus
  ));

  // Communication (20% weight): Based on work-related percentage
  const commScore = metrics.communicationEfficiency.workRelatedPercent;

  // Time Management (20% weight): On-time rate minus penalty for unjustified delays
  const delayPenalty = metrics.timeManagement.unjustifiedDelays * 10;
  const timeScore = Math.min(100, Math.max(0,
    metrics.timeManagement.onTimeDeliveryRate - delayPenalty
  ));

  // Consistency (10% weight): Start at 100, subtract for flags
  const consistencyScore = Math.min(100, Math.max(0,
    100 - (metrics.consistency.criticalFlags * 25) - (metrics.consistency.warningFlags * 10)
  ));

  // Calculate weighted final score
  const calculatedScore = Math.round(
    (resultsScore * 0.50) +
    (commScore * 0.20) +
    (timeScore * 0.20) +
    (consistencyScore * 0.10)
  );

  return `You are a performance scoring system. Calculate the performance score using EXACTLY the formulas provided below. Do NOT deviate from these calculations.

Employee: ${employeeName}

=== INPUT DATA ===

RESULTS DELIVERY:
- Completion Rate: ${metrics.resultsDelivery.completionRate}%
- Output Quality: ${metrics.resultsDelivery.taskOutputQuality}
- Total Tasks: ${metrics.resultsDelivery.totalTasks}
- Completed Tasks: ${metrics.resultsDelivery.completedTasks}

COMMUNICATION EFFICIENCY:
- Work-Related Messages: ${metrics.communicationEfficiency.workRelatedPercent}%
- Non-Work Messages: ${metrics.communicationEfficiency.nonWorkRelatedPercent}%
- Total Messages: ${metrics.communicationEfficiency.totalMessages}

TIME MANAGEMENT:
- On-Time Delivery Rate: ${metrics.timeManagement.onTimeDeliveryRate}%
- Average Delay: ${metrics.timeManagement.averageDelayDays} days
- Justified Delays: ${metrics.timeManagement.justifiedDelays}
- Unjustified Delays: ${metrics.timeManagement.unjustifiedDelays}

CONSISTENCY:
- Critical Issues: ${metrics.consistency.criticalFlags}
- Warnings: ${metrics.consistency.warningFlags}
- Recurring Issues: ${metrics.consistency.recurringIssues.length > 0 ? metrics.consistency.recurringIssues.join(', ') : 'None'}

Flags: ${flags.length > 0 ? flags.join('; ') : 'None'}

=== MANDATORY SCORING FORMULAS (USE EXACTLY) ===

1. RESULTS DELIVERY SCORE (50% weight):
   Formula: completionRate + qualityBonus
   - qualityBonus = +10 if quality is "high", 0 if "medium", -10 if "low"
   - Cap between 0-100
   YOUR CALCULATION: ${metrics.resultsDelivery.completionRate} + ${qualityBonus} = ${resultsScore}

2. COMMUNICATION SCORE (20% weight):
   Formula: workRelatedPercent (directly)
   YOUR CALCULATION: ${commScore}

3. TIME MANAGEMENT SCORE (20% weight):
   Formula: onTimeRate - (unjustifiedDelays × 10)
   - Cap between 0-100
   YOUR CALCULATION: ${metrics.timeManagement.onTimeDeliveryRate} - (${metrics.timeManagement.unjustifiedDelays} × 10) = ${timeScore}

4. CONSISTENCY SCORE (10% weight):
   Formula: 100 - (criticalFlags × 25) - (warningFlags × 10)
   - Cap between 0-100
   YOUR CALCULATION: 100 - (${metrics.consistency.criticalFlags} × 25) - (${metrics.consistency.warningFlags} × 10) = ${consistencyScore}

5. FINAL SCORE:
   Formula: (results × 0.50) + (communication × 0.20) + (time × 0.20) + (consistency × 0.10)
   YOUR CALCULATION: (${resultsScore} × 0.50) + (${commScore} × 0.20) + (${timeScore} × 0.20) + (${consistencyScore} × 0.10) = ${calculatedScore}

=== LEVEL DETERMINATION (MANDATORY) ===
- 90-100: "excellent"
- 75-89: "good"
- 60-74: "average"
- 40-59: "below_average"
- 0-39: "poor"

Based on score ${calculatedScore}, level should be: ${calculatedScore >= 90 ? 'excellent' : calculatedScore >= 75 ? 'good' : calculatedScore >= 60 ? 'average' : calculatedScore >= 40 ? 'below_average' : 'poor'}

=== YOUR TASK ===
1. Verify the calculations above are correct
2. Generate 1-3 specific recommendations based on the lowest scoring areas
3. Return the JSON response

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "score": ${calculatedScore},
  "level": "${calculatedScore >= 90 ? 'excellent' : calculatedScore >= 75 ? 'good' : calculatedScore >= 60 ? 'average' : calculatedScore >= 40 ? 'below_average' : 'poor'}",
  "breakdown": {
    "resultsDelivery": ${resultsScore},
    "communicationEfficiency": ${commScore},
    "timeManagement": ${timeScore},
    "consistency": ${consistencyScore}
  },
  "recommendations": [
    "Generate 1-3 specific recommendations based on weakest areas"
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

Look for:
1. Recurring delays on certain types of tasks
2. Productivity fluctuations (day of week, time of month)
3. Communication pattern changes
4. Improvement or decline trends
5. Signs of "busy but not productive" behavior (lots of chat, few results)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "patternsDetected": [
    {
      "type": "recurring_delay",
      "description": "Tends to delay high-priority tasks",
      "severity": "warning",
      "evidence": ["Task X delayed", "Task Y delayed"]
    }
  ],
  "overallTrend": "stable",
  "riskLevel": "medium"
}

type must be one of: recurring_delay, productivity_fluctuation, communication_change, trend, busy_not_productive
severity must be one of: info, warning, critical
overallTrend must be one of: improving, stable, declining
riskLevel must be one of: low, medium, high`;
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
  return `Generate a brief, professional performance report summary for a manager to read.

Employee: ${employeeName}
Performance Score: ${score}/100 (${level})
Tasks: ${completedTasks}/${totalTasks} completed
On-Time Delivery: ${onTimeRate}%
Work-Related Communication: ${workChatPercent}%
Issues Flagged: ${flagCount}

Write 2-3 sentences summarizing this employee's performance. Be direct and factual.
Mention any concerns if score is below 70 or flag count is above 2.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "Your summary text here",
  "highlight": "Key point to emphasize",
  "concern": "Main concern if any, or null"
}`;
}
