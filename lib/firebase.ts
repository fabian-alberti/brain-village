import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
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
import { User, Goal, NewGoal, DailyLog } from './types';
import { calculateXpReward, getLevelFromXp } from './xp';

// Firebase configuration
// Note: In production, use environment variables
const firebaseConfig = {
    apiKey: "AIzaSyB8iABywpUX-I5BAX7CnJtiqkV9wQJH9zo",
    authDomain: "brain-village-c343e.firebaseapp.com",
    projectId: "brain-village-c343e",
    storageBucket: "brain-village-c343e.firebasestorage.app",
    messagingSenderId: "468784405636",
    appId: "1:468784405636:web:69e9b7ec0d4040039536d1",
    measurementId: "G-RFSQ63053R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - simplified for React Native
const auth = getAuth(app);

// Initialize Firestore
// Firestore can appear "stuck offline" on web networks that block WebChannel.
// Long-polling is more reliable and fixes writes hanging forever.
const db =
  Platform.OS === 'web'
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      })
    : getFirestore(app);

// #region agent log
fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:initFirestore',message:'Initialized Firestore instance',data:{platform:Platform.OS,longPolling:Platform.OS==='web'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
// #endregion

export { auth, db };

// ============ AUTH FUNCTIONS ============

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user document in Firestore
  await createUserDocument(userCredential.user.uid, email, displayName);
  
  return userCredential;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ============ USER FUNCTIONS ============

export async function createUserDocument(userId: string, email: string, displayName: string) {
  const userRef = doc(db, 'users', userId);
  const userData: Omit<User, 'id'> = {
    email,
    displayName,
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:subscribeToUser:snapshot',message:'onSnapshot(user) snapshot received',data:{exists:snap.exists(),fromCache:snap.metadata.fromCache,hasPendingWrites:snap.metadata.hasPendingWrites},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as User);
    } else {
      callback(null);
    }
  }, (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:subscribeToUser:error',message:'onSnapshot(user) error',data:{error:String(error),code:(error as any)?.code,message:(error as any)?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal',message:'createGoal started',data:{goalData,online:typeof navigator !== 'undefined' ? navigator.onLine : null,hasAuthUser:!!auth.currentUser,authUidMatchesUserId:auth.currentUser?.uid === userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
  // #endregion
  
  const goalsRef = collection(db, 'users', userId, 'goals');
  const xpReward = calculateXpReward(goalData.type, goalData.limit);
  
  const goal: Omit<Goal, 'id'> = {
    ...goalData,
    currentProgress: 0,
    xpReward,
    isCompleted: false,
    consecutiveMisses: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal:beforeAddDoc',message:'About to call addDoc',data:{goal},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
  // #endregion
  
  try {
    const addPromise = addDoc(goalsRef, goal);

    // Log if/when the underlying addDoc promise eventually resolves/rejects.
    // This helps distinguish "permission-denied" (fast reject) vs "never reaches server" (hangs).
    // #region agent log
    addPromise
      .then((docRef) => {
        fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal:addDoc:resolved',message:'addDoc promise resolved',data:{docId:docRef.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
      })
      .catch((error) => {
        fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal:addDoc:rejected',message:'addDoc promise rejected',data:{error:String(error),code:(error as any)?.code,message:(error as any)?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
      });
    // #endregion

    // Add 10 second timeout - Firestore can hang on permission issues
    const docRef = await withTimeout(
      addPromise,
      10000,
      'Firebase write timed out. Please check your Firestore security rules in Firebase Console.'
    );
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal:success',message:'addDoc succeeded',data:{docId:docRef.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
    return docRef.id;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:createGoal:error',message:'addDoc failed',data:{error:String(error),code:(error as any)?.code,message:(error as any)?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
    throw error;
  }
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:subscribeToGoals:snapshot',message:'onSnapshot(goals) snapshot received',data:{size:snapshot.size,fromCache:snapshot.metadata.fromCache,hasPendingWrites:snapshot.metadata.hasPendingWrites},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    callback(goals);
  }, (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:subscribeToGoals:error',message:'onSnapshot(goals) error',data:{error:String(error),code:(error as any)?.code,message:(error as any)?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FIREBASE'})}).catch(()=>{});
    // #endregion
  });
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Goal[];
}

// ============ PROGRESS LOGGING ============

export async function logProgress(
  userId: string, 
  goalId: string, 
  amount: number,
  appName?: string
) {
  // Update goal progress
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) return;
  
  const goal = goalSnap.data() as Omit<Goal, 'id'>;
  const newProgress = goal.currentProgress + amount;
  
  await updateDoc(goalRef, {
    currentProgress: newProgress,
    updatedAt: Timestamp.now(),
  });
  
  // Update daily log
  const today = new Date().toISOString().split('T')[0];
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', today);
  const dailyLogSnap = await getDoc(dailyLogRef);
  
  if (dailyLogSnap.exists()) {
    const dailyLog = dailyLogSnap.data() as DailyLog;
    await updateDoc(dailyLogRef, {
      entries: [
        ...dailyLog.entries,
        {
          appName: appName || 'Screen Time',
          minutes: goal.type === 'app_opens_limit' ? 0 : amount,
          opens: goal.type === 'app_opens_limit' ? amount : 0,
          loggedAt: Timestamp.now(),
        }
      ]
    });
  } else {
    await setDoc(dailyLogRef, {
      date: today,
      entries: [{
        appName: appName || 'Screen Time',
        minutes: goal.type === 'app_opens_limit' ? 0 : amount,
        opens: goal.type === 'app_opens_limit' ? amount : 0,
        loggedAt: Timestamp.now(),
      }],
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
  
  // Mark goal as completed
  await updateDoc(goalRef, {
    isCompleted: true,
    consecutiveMisses: 0,
    updatedAt: Timestamp.now(),
  });
  
  // Award XP to user
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as Omit<User, 'id'>;
    const newTotalXp = user.totalXp + goal.xpReward;
    const newLevel = getLevelFromXp(newTotalXp);
    
    await updateDoc(userRef, {
      totalXp: newTotalXp,
      currentLevel: newLevel,
      goalsCompleted: user.goalsCompleted + 1,
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
    await updateDoc(dailyLogRef, {
      goalsCompleted: [...dailyLog.goalsCompleted, goalId],
      xpEarned: dailyLog.xpEarned + goal.xpReward,
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
      // Village becomes destroyed after 2 consecutive misses
      villageState: totalMisses >= 2 ? 'destroyed' : user.villageState,
    });
  }
}

// Reset daily progress (call at midnight or app start)
export async function resetDailyProgress(userId: string) {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const snapshot = await getDocs(goalsRef);
  
  const batch: Promise<void>[] = [];
  
  snapshot.docs.forEach(doc => {
    const goal = doc.data() as Omit<Goal, 'id'>;
    batch.push(
      updateDoc(doc.ref, {
        currentProgress: 0,
        isCompleted: false,
        updatedAt: Timestamp.now(),
      })
    );
  });
  
  await Promise.all(batch);
}
