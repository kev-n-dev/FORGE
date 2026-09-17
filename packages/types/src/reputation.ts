import type { ReputationEventType, ReputationLevel } from "./enums";

export interface ReputationEvent {
  id: string;
  professionalId: string;
  eventType: ReputationEventType;
  sourceType: string; // "job", "review", "verification", etc.
  sourceId: string | null;
  value: number; // Contribution to level calculation
  description: string;
  createdAt: string;
}

export interface LevelRequirement {
  level: ReputationLevel;
  name: string;
  description: string;
  requirements: LevelRequirementItem[];
}

export interface LevelRequirementItem {
  metric: string;
  label: string;
  required: number;
  current: number;
  met: boolean;
}

export interface ReputationTimeline {
  professionalId: string;
  events: ReputationTimelineEntry[];
}

export interface ReputationTimelineEntry {
  id: string;
  label: string;
  description: string;
  date: string;
  isLevelUp: boolean;
  level: ReputationLevel | null;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isSecret: boolean;
  sortOrder: number;
}

export interface EarnedAchievement {
  achievement: Achievement;
  earnedAt: string;
  progress: number; // 0-100
}
