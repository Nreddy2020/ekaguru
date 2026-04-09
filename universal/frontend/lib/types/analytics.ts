export interface WeeklyStat {
  day: string;
  fearIndex: number; // 0-10 (10 = high fear)
  confidence: number; // 0-10 (10 = high confidence)
  topicsCovered: number;
}

export type InsightType = 'success' | 'struggle' | 'pattern';

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  date: string; // ISO
  relatedTopic?: string;
}

export interface ParentAnalytics {
  studentId: string;
  currentMastery: number; // percentage
  fearReduction: number; // percentage
  activeStreak: number;
  weeklyProgress: WeeklyStat[];
  recentInsights: Insight[];
  masteredTopics: string[];
}

export default ParentAnalytics;
