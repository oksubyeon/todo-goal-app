import type { StateCreator } from 'zustand';
import { api } from '@/lib/apiClient';
import type { Todo, TodoStatus } from '@/types';
import type { AppState } from './index';

/** 카드별 마지막 이동 요청 번호. 늦게 도착한 응답이 최신 상태를 덮지 않게 합니다. */
const moveSeq = new Map<string, number>();

export type TodoInput = Partial<Omit<Todo, '_id' | 'createdAt' | 'updatedAt'>> & { title?: string };

export interface TodoSlice {
  todos: Todo[];
  todosLoaded: boolean;
  fetchTodos: () => Promise<void>;
  addTodo: (input: TodoInput) => Promise<Todo>;
  updateTodo: (id: string, input: TodoInput) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  /** 칸반 이동: 먼저 화면에 반영하고 PATCH 1회, 실패하면 되돌립니다. */
  moveTodo: (id: string, status: TodoStatus, order: string) => Promise<void>;
}

export const createTodoSlice: StateCreator<AppState, [['zustand/devtools', never]], [], TodoSlice> = (set, get) => ({
  todos: [],
  todosLoaded: false,

  fetchTodos: async () => {
    const todos = await api<Todo[]>('/api/todos');
    set({ todos, todosLoaded: true }, false, 'todos/fetch');
  },

  addTodo: async (input) => {
    const todo = await api<Todo>('/api/todos', 'POST', input);
    set((s) => ({ todos: [...s.todos, todo] }), false, 'todos/add');
    return todo;
  },

  updateTodo: async (id, input) => {
    const todo = await api<Todo>(`/api/todos/${id}`, 'PUT', input);
    set((s) => ({ todos: s.todos.map((t) => (t._id === id ? todo : t)) }), false, 'todos/update');
    return todo;
  },

  deleteTodo: async (id) => {
    await api(`/api/todos/${id}`, 'DELETE');
    set((s) => ({ todos: s.todos.filter((t) => t._id !== id) }), false, 'todos/delete');
  },

  moveTodo: async (id, status, order) => {
    const previous = get().todos.find((t) => t._id === id);
    if (!previous) return;
    const seq = (moveSeq.get(id) ?? 0) + 1;
    moveSeq.set(id, seq);
    set((s) => ({ todos: s.todos.map((t) => (t._id === id ? { ...t, status, order } : t)) }), false, 'todos/move');
    try {
      const saved = await api<Todo>(`/api/todos/${id}`, 'PATCH', { status, order });
      // 같은 카드를 그 사이에 또 옮겼다면 오래된 응답은 무시합니다.
      if (moveSeq.get(id) !== seq) return;
      set((s) => ({ todos: s.todos.map((t) => (t._id === id ? saved : t)) }), false, 'todos/moveSaved');
    } catch (err) {
      if (moveSeq.get(id) !== seq) return;
      set(
        (s) => ({
          todos: s.todos.map((t) => (t._id === id ? previous : t)),
          notice: `이동을 저장하지 못해 되돌렸습니다: ${(err as Error).message}`,
        }),
        false,
        'todos/moveRollback',
      );
    }
  },
});
