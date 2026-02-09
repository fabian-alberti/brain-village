import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { User, Goal, NewGoal } from '@/lib/types';
import { calculateXpReward } from '@/lib/xp';
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
} from '@/lib/firebase';

// ──────────────────────────────────────────────
// Set to true to bypass Firebase auth for testing
export const TEST_MODE = true;
// ──────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'test-user-001',
  email: 'test@brainvillage.dev',
  displayName: 'Test User',
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
  | { type: 'SIGN_OUT' };

// Initial state
const initialState: AppState = {
  firebaseUser: null,
  user: null,
  goals: [],
  isLoading: true,
  isAuthenticated: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FIREBASE_USER':
      return {
        ...state,
        firebaseUser: action.payload,
        isAuthenticated: !!action.payload,
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
    case 'SIGN_OUT':
      return {
        ...initialState,
        isLoading: false,
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
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  addGoal: (goalData: NewGoal) => Promise<string>;
  removeGoal: (goalId: string) => Promise<void>;
  updateGoalData: (goalId: string, data: Partial<Goal>) => Promise<void>;
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
    dispatch({ type: 'SET_FIREBASE_USER', payload: { uid: MOCK_USER.id } as any });
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
      await firebaseSignOut();
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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

  // ── Goal CRUD ──
  // In TEST_MODE these operate on local state only.
  // In production they call Firebase (and the subscription updates local state).

  const addGoal = async (goalData: NewGoal): Promise<string> => {
    if (TEST_MODE) {
      const id = generateTestId();
      const xpReward = calculateXpReward(goalData.type, goalData.limit);
      const newGoal: Goal = {
        id,
        ...goalData,
        targetCategories: goalData.targetCategories || [],
        currentProgress: 0,
        xpReward,
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

  const value: AppContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateSettings,
    addGoal,
    removeGoal,
    updateGoalData,
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
  const { isAuthenticated, isLoading, signIn, signUp, signOut } = useApp();
  return { isAuthenticated, isLoading, signIn, signUp, signOut };
}
