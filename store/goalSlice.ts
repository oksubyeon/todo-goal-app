import type { StateCreator } from 'zustand';
import { api } from '@/lib/apiClient';
import type { Goal } from '@/types';
import type { AppState } from './index';

export interface GoalInput {
  title?: string;
  description?: string;
}

export interface GoalSlice {
  goals: Goal[];
  goalsLoaded: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, input: GoalInput) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
}

export const createGoalSlice: StateCreator<AppState, [['zustand/devtools', never]], [], GoalSlice> = (set) => ({
  goals: [],
  goalsLoaded: false,

  fetchGoals: async () => {
    const goals = await api<Goal[]>('/api/goals');
    set({ goals, goalsLoaded: true }, false, 'goals/fetch');
  },

  addGoal: async (input) => {
    const goal = await api<Goal>('/api/goals', 'POST', input);
    set((s) => ({ goals: [...s.goals, goal] }), false, 'goals/add');
    return goal;
  },

  updateGoal: async (id, input) => {
    const goal = await api<Goal>(`/api/goals/${id}`, 'PUT', input);
    set((s) => ({ goals: s.goals.map((g) => (g._id === id ? goal : g)) }), false, 'goals/update');
    return goal;
  },

  deleteGoal: async (id) => {
    await api(`/api/goals/${id}`, 'DELETE');
    set(
      (s) => ({
        goals: s.goals.filter((g) => g._id !== id),
        todos: s.todos.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        plans: s.plans.map((p) => (p.goalId === id ? { ...p, goalId: null } : p)),
      }),
      false,
      'goals/delete',
    );
  },
});
