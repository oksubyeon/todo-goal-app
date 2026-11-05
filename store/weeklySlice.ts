import type { StateCreator } from 'zustand';
import { api } from '@/lib/apiClient';
import type { WeeklyPlan } from '@/types';
import type { AppState } from './index';

export interface WeeklyPlanInput {
  weekStart?: string;
  goals?: { text: string; done: boolean }[];
  memo?: string;
  retrospective?: string;
  goalId?: string | null;
}

export interface WeeklySlice {
  plans: WeeklyPlan[];
  plansLoaded: boolean;
  fetchPlans: () => Promise<void>;
  addPlan: (input: WeeklyPlanInput) => Promise<WeeklyPlan>;
  updatePlan: (id: string, input: WeeklyPlanInput) => Promise<WeeklyPlan>;
  deletePlan: (id: string) => Promise<void>;
  /** 주간 목표 체크박스: 낙관적 업데이트 후 PATCH, 실패하면 되돌립니다. */
  toggleGoal: (id: string, goalIndex: number, done: boolean) => Promise<void>;
}

/** 계획별 마지막 체크 요청 번호 */
const toggleSeq = new Map<string, number>();

const replace =(plans: WeeklyPlan[], plan: WeeklyPlan) => plans.map((p) => (p._id === plan._id ? plan : p));

export const createWeeklySlice: StateCreator<AppState, [['zustand/devtools', never]], [], WeeklySlice> = (set, get) => ({
  plans: [],
  plansLoaded: false,

  fetchPlans: async () => {
    const plans = await api<WeeklyPlan[]>('/api/weekly?limit=100');
    set({ plans, plansLoaded: true }, false, 'weekly/fetch');
  },

  addPlan: async (input) => {
    const plan = await api<WeeklyPlan>('/api/weekly', 'POST', input);
    set((s) => ({ plans: [plan, ...s.plans].sort((a, b) => b.weekStart.localeCompare(a.weekStart)) }), false, 'weekly/add');
    return plan;
  },

  updatePlan: async (id, input) => {
    const plan = await api<WeeklyPlan>(`/api/weekly/${id}`, 'PUT', input);
    set((s) => ({ plans: replace(s.plans, plan) }), false, 'weekly/update');
    return plan;
  },

  deletePlan: async (id) => {
    await api(`/api/weekly/${id}`, 'DELETE');
    set(
      (s) => ({
        plans: s.plans.filter((p) => p._id !== id),
        todos: s.todos.map((t) => (t.weeklyPlanId === id ? { ...t, weeklyPlanId: null, dayOfWeek: null } : t)),
      }),
      false,
      'weekly/delete',
    );
  },

  toggleGoal: async (id, goalIndex, done) => {
    const previous = get().plans.find((p) => p._id === id);
    if (!previous) return;
    const optimistic = { ...previous, goals: previous.goals.map((g, i) => (i === goalIndex ? { ...g, done } : g)) };
    const seq = (toggleSeq.get(id) ?? 0) + 1;
    toggleSeq.set(id, seq);
    set((s) => ({ plans: replace(s.plans, optimistic) }), false, 'weekly/toggleGoal');
    try {
      const saved = await api<WeeklyPlan>(`/api/weekly/${id}`, 'PATCH', { goalIndex, done });
      if (toggleSeq.get(id) !== seq) return; // 그 사이 다른 체크가 있었으면 오래된 응답은 무시
      set((s) => ({ plans: replace(s.plans, saved) }), false, 'weekly/toggleGoalSaved');
    } catch (err) {
      if (toggleSeq.get(id) !== seq) return;
      set((s) => ({ plans: replace(s.plans, previous), notice: (err as Error).message }), false, 'weekly/toggleGoalRollback');
    }
  },
});
