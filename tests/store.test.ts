import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countProgress, useStore } from '@/store';
import type { Todo } from '@/types';

const todo = (id: string, extra: Partial<Todo> = {}): Todo => ({
  _id: id,
  title: id,
  status: 'todo',
  priority: 'medium',
  order: 'a0',
  createdAt: '',
  updatedAt: '',
  ...extra,
});

function mockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const { status, body } = handler(url, init);
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  useStore.setState({ todos: [todo('a'), todo('b', { status: 'doing', order: 'a0' })], notice: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('moveTodo', () => {
  it('PATCH 1회로 저장하고 서버 응답으로 갱신한다', async () => {
    const fetch = mockFetch((url, init) => ({ status: 200, body: { ...todo('a'), ...JSON.parse(String(init?.body)) } }));
    await useStore.getState().moveTodo('a', 'done', 'a5');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('/api/todos/a');
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH');
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ status: 'done', order: 'a5' });
    expect(useStore.getState().todos.find((t) => t._id === 'a')).toMatchObject({ status: 'done', order: 'a5' });
  });

  it('실패하면 낙관적 변경을 되돌리고 알림을 남긴다', async () => {
    let seenDuringRequest: string | undefined;
    mockFetch(() => {
      seenDuringRequest = useStore.getState().todos.find((t) => t._id === 'a')?.status;
      return { status: 500, body: { error: '서버 오류' } };
    });
    await useStore.getState().moveTodo('a', 'done', 'a5');
    expect(seenDuringRequest).toBe('done'); // 요청 중에는 이미 화면에 반영됨
    expect(useStore.getState().todos.find((t) => t._id === 'a')).toMatchObject({ status: 'todo', order: 'a0' });
    expect(useStore.getState().notice).toContain('서버 오류');
  });
});

describe('countProgress', () => {
  it('완료 비율', () => {
    const todos = [
      todo('1', { weeklyPlanId: 'w', status: 'done' }),
      todo('2', { weeklyPlanId: 'w' }),
      todo('3', { weeklyPlanId: 'x', status: 'done' }),
    ];
    expect(countProgress(todos, 'weeklyPlanId', 'w')).toEqual({ total: 2, done: 1, percent: 50 });
    expect(countProgress(todos, 'weeklyPlanId', null)).toEqual({ total: 0, done: 0, percent: 0 });
  });
});
