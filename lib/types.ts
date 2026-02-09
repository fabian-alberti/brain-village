import { Timestamp } from 'firebase/firestore';

export type GoalType = 'overall_screen_time' | 'app_time_limit' | 'app_opens_limit';
export type VillageState = 'destroyed' | 'flourishing';

export interface UserSettings {
  notificationsEnabled: boolean;
  reminderTime: string; // "09:00"
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  totalXp: number;
  currentLevel: number;
  villageState: VillageState;
  consecutiveMisses: number;
  goalsCompleted: number;
  currentStreak: number;
  settings: UserSettings;
  createdAt: Timestamp;
}

export interface Goal {
  id: string;
  name: string;
  icon: string; // emoji
  type: GoalType;
  targetApps: string[]; // app names for app-specific goals
  limit: number; // minutes or open count
  currentProgress: number; // logged today
  xpReward: number;
  isCompleted: boolean;
  consecutiveMisses: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyLogEntry {
  appName: string;
  minutes: number;
  opens: number;
  loggedAt: Timestamp;
}

export interface DailyLog {
  date: string; // "2026-02-03"
  entries: DailyLogEntry[];
  goalsCompleted: string[];
  xpEarned: number;
}

// For creating new goals (without timestamps)
export interface NewGoal {
  name: string;
  icon: string;
  type: GoalType;
  targetApps: string[];
  limit: number;
}

// Common apps list for selection
export const COMMON_APPS = [
  { name: 'Instagram', icon: '📸' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'Twitter/X', icon: '🐦' },
  { name: 'Facebook', icon: '👥' },
  { name: 'YouTube', icon: '📺' },
  { name: 'Netflix', icon: '🎬' },
  { name: 'Snapchat', icon: '👻' },
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Reddit', icon: '🤖' },
  { name: 'Pinterest', icon: '📌' },
  { name: 'LinkedIn', icon: '💼' },
  { name: 'Discord', icon: '🎮' },
  { name: 'Twitch', icon: '🟣' },
  { name: 'Spotify', icon: '🎧' },
  { name: 'Safari', icon: '🧭' },
  { name: 'Chrome', icon: '🌐' },
  { name: 'Games', icon: '🎯' },
  { name: 'Other', icon: '📱' },
];

// Time limit presets in minutes
export const TIME_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

// Opens limit presets
export const OPENS_PRESETS = [
  { label: '5 opens', value: 5 },
  { label: '10 opens', value: 10 },
  { label: '30 opens', value: 30 },
];
