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
  profileImage: number; // 1-5, maps to Brain_Profile_X.png
  profileBgColor: string; // hex color for avatar background circle
  totalXp: number;
  currentLevel: number;
  villageState: VillageState;
  consecutiveMisses: number;
  goalsCompleted: number;
  currentStreak: number;
  settings: UserSettings;
  createdAt: Timestamp;
}

// Available background colors for profile avatar
export const PROFILE_BG_COLORS = [
  '#E8F5E9', // soft green
  '#E3F2FD', // soft blue
  '#FFF3E0', // soft orange
  '#F3E5F5', // soft purple
  '#FFF9C4', // soft yellow
  '#FFEBEE', // soft red/pink
  '#E0F7FA', // soft cyan
  '#F1F8E9', // soft lime
];

export interface Goal {
  id: string;
  name: string;
  icon?: string; // deprecated – icons are now vector-based via AppBrandIcon
  type: GoalType;
  targetApps: string[]; // individual app names
  targetCategories: string[]; // selected category IDs
  limit: number; // minutes or open count
  currentProgress: number; // logged today
  appProgress?: Record<string, number>; // per-app logged progress (appName → minutes or opens)
  xpReward: number;
  isActive: boolean; // only one goal can be active at a time
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
  icon?: string; // deprecated – icons are now vector-based via AppBrandIcon
  type: GoalType;
  targetApps: string[];
  targetCategories: string[];
  limit: number;
}

// ============ SCREEN TIME TRACKING ============

export interface ScreenTimeStatus {
  /** Whether screen time permission has been granted (or simulated). */
  hasPermission: boolean;
  /** Whether we're using simulated data (development mode). */
  isSimulated: boolean;
  /** Total device screen time today in minutes. */
  totalMinutesToday: number;
  /** Per-app screen time today (appName → minutes). */
  perApp: Record<string, number>;
  /** When the data was last refreshed. */
  lastUpdated: Date | null;
}

// ============ APP CATEGORIES ============
// Icons are handled by components/ui/AppBrandIcon.tsx (vector icons, no emojis)

export interface AppInfo {
  name: string;
  urlScheme?: string; // URL scheme to detect if app is installed on device
}

export interface AppCategory {
  id: string;
  name: string;
  apps: AppInfo[];
}

export const APP_CATEGORIES: AppCategory[] = [
  {
    id: 'social',
    name: 'Social Media',
    apps: [
      { name: 'Instagram', urlScheme: 'instagram://' },
      { name: 'TikTok', urlScheme: 'tiktok://' },
      { name: 'Twitter/X', urlScheme: 'twitter://' },
      { name: 'Facebook', urlScheme: 'fb://' },
      { name: 'Snapchat', urlScheme: 'snapchat://' },
      { name: 'LinkedIn', urlScheme: 'linkedin://' },
      { name: 'Pinterest', urlScheme: 'pinterest://' },
      { name: 'Reddit', urlScheme: 'reddit://' },
      { name: 'Threads', urlScheme: 'barcelona://' },
      { name: 'BeReal', urlScheme: 'bereal://' },
    ],
  },
  {
    id: 'games',
    name: 'Games',
    apps: [
      { name: 'Roblox', urlScheme: 'robloxmobile://' },
      { name: 'Minecraft', urlScheme: 'minecraft://' },
      { name: 'Candy Crush', urlScheme: 'candycrush://' },
      { name: 'Clash Royale', urlScheme: 'clashroyale://' },
      { name: 'Among Us', urlScheme: 'amongus://' },
      { name: 'Brawl Stars', urlScheme: 'brawlstars://' },
      { name: 'Genshin Impact', urlScheme: 'genshinimpact://' },
      { name: 'PUBG Mobile', urlScheme: 'pubgmobile://' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    apps: [
      { name: 'YouTube', urlScheme: 'youtube://' },
      { name: 'Netflix', urlScheme: 'nflx://' },
      { name: 'Twitch', urlScheme: 'twitch://' },
      { name: 'Disney+', urlScheme: 'disneyplus://' },
      { name: 'Spotify', urlScheme: 'spotify://' },
      { name: 'Apple Music', urlScheme: 'music://' },
      { name: 'Prime Video', urlScheme: 'aiv://' },
      { name: 'HBO Max', urlScheme: 'hbomax://' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    apps: [
      { name: 'Duolingo', urlScheme: 'duolingo://' },
      { name: 'Khan Academy', urlScheme: 'khanacademy://' },
      { name: 'Coursera', urlScheme: 'coursera://' },
      { name: 'Quizlet', urlScheme: 'quizlet://' },
      { name: 'Notion', urlScheme: 'notion://' },
      { name: 'Anki', urlScheme: 'anki://' },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    apps: [
      { name: 'Safari' },
      { name: 'Chrome', urlScheme: 'googlechrome://' },
      { name: 'Mail' },
      { name: 'Maps', urlScheme: 'maps://' },
      { name: 'Files' },
      { name: 'Calendar', urlScheme: 'calshow://' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    apps: [
      { name: 'Strava', urlScheme: 'strava://' },
      { name: 'MyFitnessPal', urlScheme: 'myfitnesspal://' },
      { name: 'Headspace', urlScheme: 'headspace://' },
      { name: 'Calm', urlScheme: 'calm://' },
      { name: 'Nike Run Club', urlScheme: 'nikerunclub://' },
      { name: 'Health', urlScheme: 'x-apple-health://' },
    ],
  },
  {
    id: 'news',
    name: 'News & Reading',
    apps: [
      { name: 'Apple News', urlScheme: 'applenews://' },
      { name: 'Flipboard', urlScheme: 'flipboard://' },
      { name: 'Kindle', urlScheme: 'kindle://' },
      { name: 'Medium', urlScheme: 'medium://' },
      { name: 'Pocket', urlScheme: 'pocket://' },
      { name: 'Feedly', urlScheme: 'feedly://' },
    ],
  },
  {
    id: 'messaging',
    name: 'Messaging',
    apps: [
      { name: 'WhatsApp', urlScheme: 'whatsapp://' },
      { name: 'Telegram', urlScheme: 'tg://' },
      { name: 'iMessage', urlScheme: 'messages://' },
      { name: 'Discord', urlScheme: 'discord://' },
      { name: 'Signal', urlScheme: 'sgnl://' },
      { name: 'Messenger', urlScheme: 'fb-messenger://' },
    ],
  },
];

// Flatten all apps for easy lookup
export const ALL_APPS: AppInfo[] = APP_CATEGORIES.flatMap(cat => cat.apps);

// Keep COMMON_APPS for backward compatibility
export const COMMON_APPS = ALL_APPS;

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
