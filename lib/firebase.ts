import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser
} from 'firebase/auth';
// @ts-ignore - React Native Firebase persistence
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { 
  getFirestore,
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { User, Goal, NewGoal, DailyLog } from './types';
import { calculateXpReward, calculateFinalXp, getLevelFromXp } from './xp';

const extra = Constants.expoConfig?.extra ?? {};

const FIREBASE_API_KEY = 'AIzaSyB8iABywpUX-I5BAX7CnJtiqkV9wQJH9zo';
const FIREBASE_AUTH_DOMAIN = 'brain-village-c343e.firebaseapp.com';
const FIREBASE_PROJECT_ID = 'brain-village-c343e';
const FIREBASE_STORAGE_BUCKET = 'brain-village-c343e.firebasestorage.app';
const FIREBASE_MESSAGING_SENDER_ID = '468784405636';
const FIREBASE_APP_ID = '1:468784405636:web:69e9b7ec0d4040039536d1';
const FIREBASE_MEASUREMENT_ID = 'G-RFSQ63053R';

const firebaseConfig = {
  apiKey: extra.firebaseApiKey ?? FIREBASE_API_KEY,
  authDomain: extra.firebaseAuthDomain ?? FIREBASE_AUTH_DOMAIN,
  projectId: extra.firebaseProjectId ?? FIREBASE_PROJECT_ID,
  storageBucket: extra.firebaseStorageBucket ?? FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.firebaseMessagingSenderId ?? FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.firebaseAppId ?? FIREBASE_APP_ID,
  measurementId: extra.firebaseMeasurementId ?? FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db =
  Platform.OS === 'web'
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      })
    : getFirestore(app);

export { auth, db };

// ============ AUTH FUNCTIONS ============

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDocument(userCredential.user.uid, email, displayName);
  await sendEmailVerification(userCredential.user);
  return userCredential;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
}

export async function reloadCurrentUser(): Promise<FirebaseUser | null> {
  const user = auth.currentUser;
  if (user) {
    await user.reload();
    return auth.currentUser;
  }
  return null;
}

export async function deleteUserAccount(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');

  // Re-authenticate before destructive operation
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const userId = user.uid;

  // Delete user's goals subcollection
  const goalsRef = collection(db, 'users', userId, 'goals');
  const goalsSnap = await getDocs(goalsRef);
  const goalDeletes = goalsSnap.docs.map(d => deleteDoc(d.ref));

  // Delete user's dailyLogs subcollection
  const logsRef = collection(db, 'users', userId, 'dailyLogs');
  const logsSnap = await getDocs(logsRef);
  const logDeletes = logsSnap.docs.map(d => deleteDoc(d.ref));

  await Promise.all([...goalDeletes, ...logDeletes]);

  // Delete user document
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);

  // Delete Firebase Auth account
  await firebaseDeleteUser(user);
}

// ============ USER FUNCTIONS ============

export async function createUserDocument(userId: string, email: string, displayName: string) {
  const userRef = doc(db, 'users', userId);
  const userData: Omit<User, 'id'> = {
    email,
    displayName,
    profileImage: 1,
    profileBgColor: '#E8F5E9',
    totalXp: 0,
    currentLevel: 1,
    villageState: 'flourishing',
    consecutiveMisses: 0,
    goalsCompleted: 0,
    currentStreak: 0,
    settings: {
      notificationsEnabled: true,
      reminderTime: '09:00',
    },
    createdAt: Timestamp.now(),
  };
  
  await setDoc(userRef, userData);
}

export async function getUserData(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as User;
  }
  return null;
}

export async function updateUserData(userId: string, data: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
}

export function subscribeToUser(userId: string, callback: (user: User | null) => void) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as User);
    } else {
      callback(null);
    }
  });
}

// ============ GOALS FUNCTIONS ============

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

export async function createGoal(userId: string, goalData: NewGoal): Promise<string> {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const xpReward = calculateXpReward(
    goalData.type,
    goalData.limit,
    goalData.targetApps,
    goalData.targetCategories || [],
  );

  // Deactivate all existing goals – new goal becomes the active one
  const existingGoals = await getDocs(query(goalsRef));
  for (const goalDoc of existingGoals.docs) {
    if (goalDoc.data().isActive) {
      await updateDoc(goalDoc.ref, { isActive: false, updatedAt: Timestamp.now() });
    }
  }
  
  const goal: Omit<Goal, 'id'> = {
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
  
  const docRef = await withTimeout(
    addDoc(goalsRef, goal),
    10000,
    'Firebase write timed out. Please check your Firestore security rules.'
  );
  return docRef.id;
}

export async function updateGoal(userId: string, goalId: string, data: Partial<Goal>) {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await updateDoc(goalRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteGoal(userId: string, goalId: string) {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(goalRef);
}

export function subscribeToGoals(userId: string, callback: (goals: Goal[]) => void) {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Ensure targetCategories exists for backward compatibility
        targetCategories: data.targetCategories || [],
        targetApps: data.targetApps || [],
      } as Goal;
    });
    callback(goals);
  });
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      targetCategories: data.targetCategories || [],
      targetApps: data.targetApps || [],
    } as Goal;
  });
}

// ============ PROGRESS LOGGING ============

export async function logProgress(
  userId: string, 
  goalId: string, 
  amount: number,
  appName?: string
) {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) return;
  
  const goal = goalSnap.data() as Omit<Goal, 'id'> & { appProgress?: Record<string, number> };

  // Overwrite per-app value (amount is the total for today, not a delta)
  const updatedAppProgress = { ...(goal.appProgress || {}) };
  if (appName) {
    updatedAppProgress[appName] = amount;
  }

  // Recalculate total from all per-app values
  const newProgress = Object.values(updatedAppProgress).reduce((sum, v) => sum + v, 0);
  
  await updateDoc(goalRef, {
    currentProgress: newProgress,
    appProgress: updatedAppProgress,
    updatedAt: Timestamp.now(),
  });
  
  // Update daily log — upsert by appName to avoid unbounded growth.
  // Each app gets at most one entry per day; its values are overwritten
  // on every progress update rather than appending a new row each time.
  const entryKey = appName || 'Screen Time';
  const today = new Date().toISOString().split('T')[0];
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', today);
  const dailyLogSnap = await getDoc(dailyLogRef);

  const newEntry = {
    appName: entryKey,
    minutes: goal.type === 'app_opens_limit' ? 0 : amount,
    opens: goal.type === 'app_opens_limit' ? amount : 0,
    loggedAt: Timestamp.now(),
  };

  if (dailyLogSnap.exists()) {
    const dailyLog = dailyLogSnap.data() as DailyLog;
    const existingIdx = dailyLog.entries.findIndex(e => e.appName === entryKey);
    const updatedEntries =
      existingIdx >= 0
        ? dailyLog.entries.map((e, i) => (i === existingIdx ? newEntry : e))
        : [...dailyLog.entries, newEntry];
    await updateDoc(dailyLogRef, { entries: updatedEntries });
  } else {
    await setDoc(dailyLogRef, {
      date: today,
      entries: [newEntry],
      goalsCompleted: [],
      xpEarned: 0,
    });
  }
}

export async function completeGoal(userId: string, goalId: string) {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) return;
  
  const goal = { id: goalSnap.id, ...goalSnap.data() } as Goal;
  
  await updateDoc(goalRef, {
    isCompleted: true,
    consecutiveMisses: 0,
    updatedAt: Timestamp.now(),
  });
  
  // Award XP to user (with streak multiplier + completion bonus)
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as Omit<User, 'id'>;
    const newStreak = (user.currentStreak || 0) + 1;
    const earnedXp = calculateFinalXp(goal.xpReward, newStreak);
    const newTotalXp = user.totalXp + earnedXp;
    const newLevel = getLevelFromXp(newTotalXp);
    
    await updateDoc(userRef, {
      totalXp: newTotalXp,
      currentLevel: newLevel,
      goalsCompleted: user.goalsCompleted + 1,
      currentStreak: newStreak,
      consecutiveMisses: 0,
      villageState: 'flourishing',
    });
  }
  
  // Update daily log
  const today = new Date().toISOString().split('T')[0];
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', today);
  const dailyLogSnap = await getDoc(dailyLogRef);
  
  if (dailyLogSnap.exists()) {
    const dailyLog = dailyLogSnap.data() as DailyLog;
    const user = (await getDoc(userRef)).data() as Omit<User, 'id'>;
    const earnedXp = calculateFinalXp(goal.xpReward, user.currentStreak || 1);
    await updateDoc(dailyLogRef, {
      goalsCompleted: [...dailyLog.goalsCompleted, goalId],
      xpEarned: dailyLog.xpEarned + earnedXp,
    });
  }
}

export async function failGoal(userId: string, goalId: string) {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) return;
  
  const goal = goalSnap.data() as Omit<Goal, 'id'>;
  const newMisses = goal.consecutiveMisses + 1;
  
  await updateDoc(goalRef, {
    consecutiveMisses: newMisses,
    updatedAt: Timestamp.now(),
  });
  
  // Update user consecutive misses
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as Omit<User, 'id'>;
    const totalMisses = user.consecutiveMisses + 1;
    
    await updateDoc(userRef, {
      consecutiveMisses: totalMisses,
      currentStreak: 0,
      villageState: totalMisses >= 2 ? 'destroyed' : user.villageState,
    });
  }
}

// Reset daily progress (called automatically at start of new day)
export async function resetDailyProgress(userId: string) {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const snapshot = await getDocs(goalsRef);
  
  const batch: Promise<void>[] = [];
  
  snapshot.docs.forEach(d => {
    batch.push(
      updateDoc(d.ref, {
        currentProgress: 0,
        appProgress: {},
        isCompleted: false,
        updatedAt: Timestamp.now(),
      })
    );
  });
  
  await Promise.all(batch);
}
