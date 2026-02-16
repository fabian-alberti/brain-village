import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback, ReactNode } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { User, Goal, NewGoal, ScreenTimeStatus } from '@/lib/types';
import { calculateXpReward, calculateFinalXp } from '@/lib/xp';
import { 
  onAuthChange, 
  subscribeToUser, 
  subscribeToGoals,
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  updateUserData,
  createUserDocument,
  createGoal as firebaseCreateGoal,
  updateGoal as firebaseUpdateGoal,
  deleteGoal as firebaseDeleteGoal,
  logProgress as firebaseLogProgress,
  completeGoal as firebaseCompleteGoal,
  deleteUserAccount as firebaseDeleteUserAccount,
  resendVerificationEmail as firebaseResendVerification,
  reloadCurrentUser as firebaseReloadCurrentUser,
} from '@/lib/firebase';
import {
  getScreenTimeToday,
  filterPerAppScreenTime,
  hasPermission as hasScreenTimePermission,
  requestPermission as requestScreenTimePermissionNative,
  isSimulationMode,
} from '@/lib/screenTime';
import {
  isDailyResetNeeded,
  performLocalDailyReset,
  performFirebaseDailyReset,
} from '@/lib/dailyReset';
import {
  syncDailyReminder,
  checkProgressWarning,
  cancelAllNotifications,
  resetProgressWarnings,
} from '@/lib/notifications';
import { TEST_MODE } from '@/lib/config';

export { TEST_MODE };

const MOCK_USER: User = {
  id: 'test-user-001',
  email: 'test@brainvillage.dev',
  displayName: 'Test User',
  profileImage: 1,
  profileBgColor: '#E8F5E9',
  totalXp: 150,
  currentLevel: 2,
  villageState: 'flourishing',
  consecutiveMisses: 0,
  goalsCompleted: 3,
  currentStreak: 5,
  settings: {
    notificationsEnabled: true,
    reminderTime: '09:00',
  },
  createdAt: Timestamp.now(),
};

const MOCK_GOALS: Goal[] = [];

// Generate a simple unique ID for test mode
let nextId = 1;
function generateTestId() {
  return `test-goal-${Date.now()}-${nextId++}`;
}

// State types
interface AppState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  goals: Goal[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  screenTimeStatus: ScreenTimeStatus;
}

// Action types
type AppAction =
  | { type: 'SET_FIREBASE_USER'; payload: FirebaseUser | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: User['settings'] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'REMOVE_GOAL'; payload: string }
  | { type: 'UPDATE_GOAL'; payload: { id: string; data: Partial<Goal> } }
  | { type: 'SET_SCREEN_TIME'; payload: Partial<ScreenTimeStatus> }
  | { type: 'SIGN_OUT' };

// Initial state
const defaultScreenTimeStatus: ScreenTimeStatus = {
  hasPermission: false,
  isSimulated: isSimulationMode(),
  totalMinutesToday: 0,
  perApp: {},
  lastUpdated: null,
};

const initialState: AppState = {
  firebaseUser: null,
  user: null,
  goals: [],
  isLoading: true,
  isAuthenticated: false,
  isEmailVerified: false,
  screenTimeStatus: defaultScreenTimeStatus,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FIREBASE_USER':
      return {
        ...state,
        firebaseUser: action.payload,
        isAuthenticated: !!action.payload,
        isEmailVerified: action.payload?.emailVerified ?? false,
        isLoading: false,
      };
    case 'SET_USER': {
      if (action.payload) {
        const defaultSettings = {
          notificationsEnabled: true,
          reminderTime: '09:00',
        };
        action.payload = {
          ...action.payload,
          settings: {
            ...defaultSettings,
            ...(action.payload.settings || {}),
          },
        };
      }
      return {
        ...state,
        user: action.payload,
      };
    }
    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_SETTINGS':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          settings: action.payload,
        },
      };
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [action.payload, ...state.goals],
      };
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload.data, updatedAt: Timestamp.now() } : g
        ),
      };
    case 'SET_SCREEN_TIME':
      return {
        ...state,
        screenTimeStatus: { ...state.screenTimeStatus, ...action.payload },
      };
    case 'SIGN_OUT':
      return {
        ...initialState,
        isLoading: false,
        isEmailVerified: false,
      };
    default:
      return state;
  }
}

// Context type
interface AppContextType extends AppState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'displayName' | 'profileImage' | 'profileBgColor'>>) => Promise<void>;
  addGoal: (goalData: NewGoal) => Promise<string>;
  removeGoal: (goalId: string) => Promise<void>;
  updateGoalData: (goalId: string, data: Partial<Goal>) => Promise<void>;
  toggleGoalActive: (goalId: string) => Promise<void>;
  logGoalProgress: (goalId: string, amount: number, appName?: string) => Promise<void>;
  markGoalComplete: (goalId: string) => Promise<void>;
  requestScreenTimePermission: () => Promise<boolean>;
  refreshScreenTime: () => Promise<void>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ── TEST MODE: skip Firebase, inject mock data immediately ──
  useEffect(() => {
    if (!TEST_MODE) return;
    dispatch({ type: 'SET_USER', payload: MOCK_USER });
    dispatch({ type: 'SET_GOALS', payload: MOCK_GOALS });
    dispatch({ type: 'SET_FIREBASE_USER', payload: { uid: MOCK_USER.id, emailVerified: true } as any });
  }, []);

  // Listen to auth state changes (skipped in TEST_MODE)
  useEffect(() => {
    if (TEST_MODE) return;
    const unsubscribe = onAuthChange((firebaseUser) => {
      dispatch({ type: 'SET_FIREBASE_USER', payload: firebaseUser });
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user data when authenticated (skipped in TEST_MODE)
  useEffect(() => {
    if (TEST_MODE) return;

    if (!state.firebaseUser) {
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_GOALS', payload: [] });
      return;
    }

    const unsubscribeUser = subscribeToUser(state.firebaseUser.uid, (user) => {
      if (!user && state.firebaseUser) {
        const email = state.firebaseUser.email || '';
        const displayName = state.firebaseUser.displayName || 'User';
        createUserDocument(state.firebaseUser.uid, email, displayName).catch(console.error);
        return;
      }
      dispatch({ type: 'SET_USER', payload: user });
    });

    const unsubscribeGoals = subscribeToGoals(state.firebaseUser.uid, (goals) => {
      dispatch({ type: 'SET_GOALS', payload: goals });
    });

    return () => {
      unsubscribeUser();
      unsubscribeGoals();
    };
  }, [state.firebaseUser]);

  // ── NOTIFICATIONS: sync daily reminder when user/settings change ──
  useEffect(() => {
    if (!state.user) return;
    const { notificationsEnabled, reminderTime } = state.user.settings || {
      notificationsEnabled: true,
      reminderTime: '09:00',
    };
    syncDailyReminder(reminderTime, notificationsEnabled);
  }, [state.user?.settings?.notificationsEnabled, state.user?.settings?.reminderTime]);

  // ── AUTOMATED DAILY RESET ──
  // Checks on mount and on app foreground whether a new day has started.
  // If yes: fails uncompleted active goals, then resets all daily progress.

  const dailyResetRunning = useRef(false);
  const goalsRef = useRef(state.goals);
  goalsRef.current = state.goals;
  const userRef = useRef(state.user);
  userRef.current = state.user;
  const firebaseUserRef = useRef(state.firebaseUser);
  firebaseUserRef.current = state.firebaseUser;
  const notificationsEnabledRef = useRef(state.user?.settings?.notificationsEnabled ?? true);
  notificationsEnabledRef.current = state.user?.settings?.notificationsEnabled ?? true;

  const runDailyReset = useCallback(async () => {
    if (dailyResetRunning.current) return;
    const userId = state.firebaseUser?.uid;
    if (!userId) return;
    const goals = goalsRef.current;
    if (!goals) return;

    const needed = await isDailyResetNeeded();
    if (!needed) return;

    dailyResetRunning.current = true;
    try {
      if (TEST_MODE) {
        const result = await performLocalDailyReset(goals, userRef.current);
        if (result.didReset) {
          // Fail uncompleted goals locally
          for (const goalId of result.failedGoalIds) {
            const goal = goals.find(g => g.id === goalId);
            if (goal) {
              dispatch({
                type: 'UPDATE_GOAL',
                payload: {
                  id: goalId,
                  data: { consecutiveMisses: goal.consecutiveMisses + 1 },
                },
              });
            }
          }
          // Update user misses if any goals failed
          if (result.failedGoalIds.length > 0 && userRef.current) {
            const totalMisses = userRef.current.consecutiveMisses + 1;
            dispatch({
              type: 'SET_USER',
              payload: {
                ...userRef.current,
                consecutiveMisses: totalMisses,
                currentStreak: 0,
                villageState: totalMisses >= 2 ? 'destroyed' : userRef.current.villageState,
              },
            });
          }
          // Reset all goals' daily progress
          for (const goal of goals) {
            dispatch({
              type: 'UPDATE_GOAL',
              payload: {
                id: goal.id,
                data: { currentProgress: 0, appProgress: {}, isCompleted: false },
              },
            });
          }
          console.log(`[DailyReset] Reset complete. Failed ${result.failedGoalIds.length} goal(s).`);
          await resetProgressWarnings();
        }
      } else {
        const result = await performFirebaseDailyReset(userId, goals);
        if (result.didReset) {
          console.log(`[DailyReset] Firebase reset complete. Failed ${result.failedGoalIds.length} goal(s).`);
          await resetProgressWarnings();
        }
      }
    } catch (e) {
      console.error('[DailyReset] Error:', e);
    } finally {
      dailyResetRunning.current = false;
    }
  }, [state.firebaseUser?.uid]);

  // Run daily reset on initial auth and when app comes to foreground
  useEffect(() => {
    if (!state.firebaseUser) return;

    // Run immediately on auth
    runDailyReset();

    // Run when app comes to foreground
    let prevState: AppStateStatus = RNAppState.currentState;
    const sub = RNAppState.addEventListener('change', (nextState) => {
      if (prevState.match(/inactive|background/) && nextState === 'active') {
        runDailyReset();
      }
      prevState = nextState;
    });

    return () => sub.remove();
  }, [state.firebaseUser, runDailyReset]);

  // ── SCREEN TIME TRACKING ──
  // Fetches screen time from native APIs (or simulation) on mount,
  // every time the app comes to foreground, and on a periodic interval,
  // then auto-updates active goals.

  const fetchAndUpdateScreenTime = useCallback(async () => {
    const today = await getScreenTimeToday();
    dispatch({
      type: 'SET_SCREEN_TIME',
      payload: {
        totalMinutesToday: today.totalMinutes,
        perApp: today.perApp,
        lastUpdated: new Date(),
      },
    });

    const currentGoals = goalsRef.current;
    const uid = firebaseUserRef.current?.uid;

    for (const goal of currentGoals) {
      if (!goal.isActive || goal.isCompleted) continue;

      if (goal.type === 'overall_screen_time') {
        if (today.totalMinutes > goal.currentProgress) {
          if (TEST_MODE) {
            dispatch({
              type: 'UPDATE_GOAL',
              payload: {
                id: goal.id,
                data: { currentProgress: today.totalMinutes },
              },
            });
          } else if (uid) {
            firebaseLogProgress(uid, goal.id, today.totalMinutes).catch(e =>
              console.error('[ScreenTime] Failed to log progress:', e)
            );
          }
          checkProgressWarning(
            goal.id,
            goal.name,
            today.totalMinutes,
            goal.limit,
            notificationsEnabledRef.current,
          );
        }
      }

      if (goal.type === 'app_time_limit') {
        const trackedApps = [...goal.targetApps];
        const perApp = filterPerAppScreenTime(trackedApps, today.perApp);
        let changed = false;
        const updatedAppProgress = { ...(goal.appProgress || {}) };

        for (const [appName, minutes] of Object.entries(perApp)) {
          const current = updatedAppProgress[appName] || 0;
          if (minutes > current) {
            updatedAppProgress[appName] = minutes;
            changed = true;
          }
        }

        if (changed) {
          const newTotal = Object.values(updatedAppProgress).reduce((s, v) => s + v, 0);
          if (TEST_MODE) {
            dispatch({
              type: 'UPDATE_GOAL',
              payload: {
                id: goal.id,
                data: { currentProgress: newTotal, appProgress: updatedAppProgress },
              },
            });
          } else if (uid) {
            for (const [appName, minutes] of Object.entries(perApp)) {
              if (minutes > (goal.appProgress?.[appName] || 0)) {
                firebaseLogProgress(uid, goal.id, minutes, appName).catch(e =>
                  console.error('[ScreenTime] Failed to log per-app progress:', e)
                );
              }
            }
          }
          checkProgressWarning(
            goal.id,
            goal.name,
            newTotal,
            goal.limit,
            notificationsEnabledRef.current,
          );
        }
      }

      // TODO: app_opens_limit goals are not tracked automatically.
      // Android's UsageStatsManager does not expose per-app open counts.
      // A custom native implementation (e.g. UsageEvents query) is needed
      // to count app launches and feed them into goal progress here.
    }
  }, []);

  // Check permission on auth, refresh on foreground, and poll periodically
  useEffect(() => {
    if (!state.firebaseUser) return;

    const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const checkAndFetch = async () => {
      const hasPerm = await hasScreenTimePermission();
      dispatch({
        type: 'SET_SCREEN_TIME',
        payload: { hasPermission: hasPerm },
      });
      if (hasPerm) {
        await runDailyReset();
        await fetchAndUpdateScreenTime();
      }
    };

    checkAndFetch();

    let prevAppState: AppStateStatus = RNAppState.currentState;
    const sub = RNAppState.addEventListener('change', async (nextState) => {
      if (prevAppState.match(/inactive|background/) && nextState === 'active') {
        await checkAndFetch();
      }
      prevAppState = nextState;
    });

    const interval = setInterval(() => {
      fetchAndUpdateScreenTime();
    }, POLL_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [state.firebaseUser, fetchAndUpdateScreenTime, runDailyReset]);

  // Open native settings to grant screen time permission
  const requestScreenTimePermission = useCallback(async (): Promise<boolean> => {
    return requestScreenTimePermissionNative();
  }, []);

  // Manual refresh of screen time data
  const refreshScreenTime = useCallback(async () => {
    await fetchAndUpdateScreenTime();
  }, [fetchAndUpdateScreenTime]);

  // Auth functions
  const signIn = async (email: string, password: string) => {
    if (TEST_MODE) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseSignIn(email, password);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (TEST_MODE) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseSignUp(email, password, displayName);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOut = async () => {
    if (TEST_MODE) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await cancelAllNotifications();
      await firebaseSignOut();
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteAccount = async (password: string) => {
    if (TEST_MODE) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseDeleteUserAccount(password);
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resendVerificationEmail = async () => {
    if (TEST_MODE) return;
    await firebaseResendVerification();
  };

  const refreshEmailVerified = async (): Promise<boolean> => {
    if (TEST_MODE) return true;
    const refreshedUser = await firebaseReloadCurrentUser();
    if (refreshedUser) {
      dispatch({ type: 'SET_FIREBASE_USER', payload: refreshedUser });
      return refreshedUser.emailVerified;
    }
    return false;
  };

  const updateSettings = async (settings: Partial<User['settings']>) => {
    if (!state.user) return;
    
    const defaultSettings = {
      notificationsEnabled: true,
      reminderTime: '09:00',
    };
    
    const currentSettings = state.user.settings || defaultSettings;
    const newSettings = { ...currentSettings, ...settings };
    
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    
    if (!TEST_MODE && state.firebaseUser) {
      try {
        await updateUserData(state.firebaseUser.uid, {
          settings: newSettings,
        });
      } catch (error) {
        console.error('Failed to update settings:', error);
      }
    }
  };

  const updateProfile = async (data: Partial<Pick<User, 'displayName' | 'profileImage' | 'profileBgColor'>>) => {
    if (!state.user) return;

    // Update local state immediately
    dispatch({ type: 'SET_USER', payload: { ...state.user, ...data } });

    // Persist to Firebase when not in test mode
    if (!TEST_MODE && state.firebaseUser) {
      try {
        await updateUserData(state.firebaseUser.uid, data);
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
  };

  // ── Goal CRUD ──
  // In TEST_MODE these operate on local state only.
  // In production they call Firebase (and the subscription updates local state).

  const addGoal = async (goalData: NewGoal): Promise<string> => {
    if (TEST_MODE) {
      const id = generateTestId();
      const xpReward = calculateXpReward(
        goalData.type,
        goalData.limit,
        goalData.targetApps,
        goalData.targetCategories || [],
      );
      // Deactivate all existing goals – new goal becomes the active one
      state.goals.forEach(g => {
        if (g.isActive) {
          dispatch({ type: 'UPDATE_GOAL', payload: { id: g.id, data: { isActive: false } } });
        }
      });
      const newGoal: Goal = {
        id,
        ...goalData,
        targetCategories: goalData.targetCategories || [],
        currentProgress: 0,
        xpReward,
        isActive: true,
        isCompleted: false,
        consecutiveMisses: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      dispatch({ type: 'ADD_GOAL', payload: newGoal });
      return id;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    return firebaseCreateGoal(state.firebaseUser.uid, goalData);
  };

  const removeGoal = async (goalId: string): Promise<void> => {
    if (TEST_MODE) {
      dispatch({ type: 'REMOVE_GOAL', payload: goalId });
      return;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    await firebaseDeleteGoal(state.firebaseUser.uid, goalId);
  };

  const updateGoalData = async (goalId: string, data: Partial<Goal>): Promise<void> => {
    if (TEST_MODE) {
      dispatch({ type: 'UPDATE_GOAL', payload: { id: goalId, data } });
      return;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    await firebaseUpdateGoal(state.firebaseUser.uid, goalId, data);
  };

  // ── Toggle goal active (only one at a time) ──

  const toggleGoalActive = async (goalId: string): Promise<void> => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const isCurrentlyActive = goal.isActive;

    if (TEST_MODE) {
      // If activating, deactivate all others first
      if (!isCurrentlyActive) {
        state.goals.forEach(g => {
          if (g.id !== goalId && g.isActive) {
            dispatch({ type: 'UPDATE_GOAL', payload: { id: g.id, data: { isActive: false } } });
          }
        });
      }
      dispatch({ type: 'UPDATE_GOAL', payload: { id: goalId, data: { isActive: !isCurrentlyActive } } });
      return;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    // Deactivate all others when activating
    if (!isCurrentlyActive) {
      for (const g of state.goals) {
        if (g.id !== goalId && g.isActive) {
          await firebaseUpdateGoal(state.firebaseUser.uid, g.id, { isActive: false });
        }
      }
    }
    await firebaseUpdateGoal(state.firebaseUser.uid, goalId, { isActive: !isCurrentlyActive });
  };

  // ── Progress logging ──
  // In TEST_MODE updates local state; in production calls Firebase.

  const logGoalProgress = async (goalId: string, amount: number, appName?: string): Promise<void> => {
    if (TEST_MODE) {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return;

      // Overwrite per-app progress (the logged value is the total for today, not a delta)
      const updatedAppProgress = { ...(goal.appProgress || {}) };
      if (appName) {
        updatedAppProgress[appName] = amount;
      }

      // Recalculate total from all per-app values
      const newTotal = Object.values(updatedAppProgress).reduce((sum, v) => sum + v, 0);

      dispatch({
        type: 'UPDATE_GOAL',
        payload: {
          id: goalId,
          data: {
            currentProgress: newTotal,
            appProgress: updatedAppProgress,
          },
        },
      });

      // Fire progress warning if threshold crossed
      checkProgressWarning(
        goal.id,
        goal.name,
        newTotal,
        goal.limit,
        notificationsEnabledRef.current,
      );
      return;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    await firebaseLogProgress(state.firebaseUser.uid, goalId, amount, appName);
  };

  const markGoalComplete = async (goalId: string): Promise<void> => {
    if (TEST_MODE) {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return;
      dispatch({
        type: 'UPDATE_GOAL',
        payload: {
          id: goalId,
          data: { isCompleted: true, consecutiveMisses: 0 },
        },
      });
      // Award XP locally with streak multiplier + completion bonus
      if (state.user) {
        const newStreak = (state.user.currentStreak || 0) + 1;
        const earnedXp = calculateFinalXp(goal.xpReward, newStreak);
        const newTotalXp = state.user.totalXp + earnedXp;
        dispatch({
          type: 'SET_USER',
          payload: {
            ...state.user,
            totalXp: newTotalXp,
            goalsCompleted: state.user.goalsCompleted + 1,
            currentStreak: newStreak,
          },
        });
      }
      return;
    }

    if (!state.firebaseUser) throw new Error('User not authenticated');
    await firebaseCompleteGoal(state.firebaseUser.uid, goalId);
  };

  const value: AppContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    resendVerificationEmail,
    refreshEmailVerified,
    updateSettings,
    updateProfile,
    addGoal,
    removeGoal,
    updateGoalData,
    toggleGoalActive,
    logGoalProgress,
    markGoalComplete,
    requestScreenTimePermission,
    refreshScreenTime,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { user } = useApp();
  return user;
}

export function useGoals() {
  const { goals } = useApp();
  return goals;
}

export function useAuth() {
  const { isAuthenticated, isEmailVerified, isLoading, signIn, signUp, signOut, deleteAccount, resendVerificationEmail, refreshEmailVerified } = useApp();
  return { isAuthenticated, isEmailVerified, isLoading, signIn, signUp, signOut, deleteAccount, resendVerificationEmail, refreshEmailVerified };
}

export function useScreenTime() {
  const { screenTimeStatus, requestScreenTimePermission, refreshScreenTime } = useApp();
  return { ...screenTimeStatus, requestScreenTimePermission, refreshScreenTime };
}
