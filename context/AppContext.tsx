import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, Goal } from '@/lib/types';
import { 
  onAuthChange, 
  subscribeToUser, 
  subscribeToGoals,
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  updateUserData,
  createUserDocument,
} from '@/lib/firebase';

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
      // Ensure user always has default settings (for users created before settings existed)
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
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      dispatch({ type: 'SET_FIREBASE_USER', payload: firebaseUser });
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user data when authenticated
  useEffect(() => {
    if (!state.firebaseUser) {
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_GOALS', payload: [] });
      return;
    }

    const unsubscribeUser = subscribeToUser(state.firebaseUser.uid, (user) => {
      if (!user && state.firebaseUser) {
        // User document doesn't exist (legacy user) — auto-create it
        const email = state.firebaseUser.email || '';
        const displayName = state.firebaseUser.displayName || 'User';
        createUserDocument(state.firebaseUser.uid, email, displayName).catch(console.error);
        // The subscription will fire again after the document is created
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
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseSignIn(email, password);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseSignUp(email, password, displayName);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await firebaseSignOut();
      dispatch({ type: 'SIGN_OUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSettings = async (settings: Partial<User['settings']>) => {
    if (!state.firebaseUser || !state.user) return;
    
    const defaultSettings = {
      notificationsEnabled: true,
      reminderTime: '09:00',
    };
    
    const currentSettings = state.user.settings || defaultSettings;
    const newSettings = { ...currentSettings, ...settings };
    
    // Optimistic update - update local state immediately
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    
    // Then persist to Firebase
    try {
      await updateUserData(state.firebaseUser.uid, {
        settings: newSettings,
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const value: AppContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateSettings,
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
