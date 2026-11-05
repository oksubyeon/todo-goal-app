export type TodoStatus = 'todo' | 'doing' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export const STATUSES: TodoStatus[] = ['todo', 'doing', 'done'];
export const STATUS_LABEL: Record<TodoStatus, string> = { todo: '할 일', doing: '진행 중', done: '완료' };
export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export const MAX_WEEKLY_GOALS = 5;

export interface Goal {
  _id: string;
  title: string;
  description: string;
  /** 연결된 할 일의 완료율 0-100. 저장하지 않고 조회할 때 계산합니다. */
  progress: number;
  todoCount: number;
  doneCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoal {
  _id: string;
  text: string;
  done: boolean;
}

export interface WeeklyPlan {
  _id: string;
  /** UTC 자정 ISO 문자열 (월요일) */
  weekStart: string;
  goals: WeeklyGoal[];
  memo: string;
  retrospective: string;
  goalId?: string | null;
  /** 이 주에 속한 할 일 기준 진행률 (조회 시 계산) */
  todoTotal: number;
  todoDone: number;
  todoProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: Priority;
  dueDate?: string | null;
  dayOfWeek?: number | null;
  order: string;
  weeklyPlanId?: string | null;
  goalId?: string | null;
  createdAt: string;
  updatedAt: string;
}
