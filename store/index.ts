'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createTodoSlice, type TodoSlice } from './todoSlice';
import { createWeeklySlice, type WeeklySlice } from './weeklySlice';
import { createGoalSlice, type GoalSlice } from './goalSlice';
import { useShallow } from 'zustand/react/shallow';
import { percent } from '@/lib/utils';
import type { Todo } from '@/types';

interface UiSlice {
  /** 화면 하단에 잠깐 보여 줄 오류/알림 메시지 */
  notice: string | null;
  setNotice: (notice: string | null) => void;
}

export type AppState = TodoSlice & WeeklySlice & GoalSlice & UiSlice;

export const useStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createTodoSlice(...a),
      ...createWeeklySlice(...a),
      ...createGoalSlice(...a),
      notice: null,
      setNotice: (notice) => a[0]({ notice }, false, 'ui/notice'),
    }),
    { name: 'todo-goal-app' },
  ),
);

/** 화면에서 필요한 데이터를 한 번씩 불러옵니다. 실패하면 notice에 메시지를 남깁니다. */
export function useLoad(...keys: ('todos' | 'plans' | 'goals')[]) {
  const key = keys.join(',');
  useEffect(() => {
    const s = useStore.getState();
    const jobs = key.split(',').map((k) => {
      if (k === 'todos' && !s.todosLoaded) return s.fetchTodos();
      if (k === 'plans' && !s.plansLoaded) return s.fetchPlans();
      if (k === 'goals' && !s.goalsLoaded) return s.fetchGoals();
      return Promise.resolve();
    });
    Promise.all(jobs).catch((err: Error) => s.setNotice(`데이터를 불러오지 못했습니다: ${err.message}`));
  }, [key]);
}

/** 스토어의 할 일로 진행률을 계산해 상태 변경이 즉시 반영되게 합니다. */
export function useProgress(field: 'weeklyPlanId' | 'goalId', id: string | null | undefined) {
  return useStore(useShallow((s) => countProgress(s.todos, field, id)));
}

export function countProgress(todos: Todo[], field: 'weeklyPlanId' | 'goalId', id: string | null | undefined) {
  let total = 0;
  let done = 0;
  if (id) {
    for (const t of todos) {
      if (t[field] !== id) continue;
      total++;
      if (t.status === 'done') done++;
    }
  }
  return { total, done, percent: percent(done, total) };
}
