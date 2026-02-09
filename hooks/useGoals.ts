import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  logProgress,
  completeGoal,
  failGoal,
  resetDailyProgress 
} from '@/lib/firebase';
import { NewGoal, Goal } from '@/lib/types';

/**
 * Custom hook for goal operations
 * Provides convenient methods for CRUD operations on goals
 */
export function useGoalOperations() {
  const { firebaseUser, goals } = useApp();
  const userId = firebaseUser?.uid;

  const create = useCallback(async (goalData: NewGoal) => {
    if (!userId) throw new Error('User not authenticated');
    return createGoal(userId, goalData);
  }, [userId]);

  const update = useCallback(async (goalId: string, data: Partial<Goal>) => {
    if (!userId) throw new Error('User not authenticated');
    return updateGoal(userId, goalId, data);
  }, [userId]);

  const remove = useCallback(async (goalId: string) => {
    if (!userId) throw new Error('User not authenticated');
    return deleteGoal(userId, goalId);
  }, [userId]);

  const log = useCallback(async (goalId: string, amount: number, appName?: string) => {
    if (!userId) throw new Error('User not authenticated');
    return logProgress(userId, goalId, amount, appName);
  }, [userId]);

  const complete = useCallback(async (goalId: string) => {
    if (!userId) throw new Error('User not authenticated');
    return completeGoal(userId, goalId);
  }, [userId]);

  const fail = useCallback(async (goalId: string) => {
    if (!userId) throw new Error('User not authenticated');
    return failGoal(userId, goalId);
  }, [userId]);

  const resetDaily = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated');
    return resetDailyProgress(userId);
  }, [userId]);

  const getGoalById = useCallback((goalId: string) => {
    return goals.find(g => g.id === goalId) || null;
  }, [goals]);

  const getActiveGoals = useCallback(() => {
    return goals.filter(g => !g.isCompleted);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(g => g.isCompleted);
  }, [goals]);

  return {
    goals,
    create,
    update,
    remove,
    log,
    complete,
    fail,
    resetDaily,
    getGoalById,
    getActiveGoals,
    getCompletedGoals,
  };
}
