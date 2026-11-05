import { describe, expect, it } from 'vitest';
import { computeDrop, sortColumn } from '@/lib/kanban';
import type { Priority, TodoStatus } from '@/types';

const t = (id: string, status: TodoStatus, order: string, priority: Priority = 'medium') => ({ _id: id, status, order, priority });

// todo: a(a0) b(a1) c(a2) / doing: d(a0) / done: 비어 있음
const base = [t('a', 'todo', 'a0'), t('b', 'todo', 'a1'), t('c', 'todo', 'a2'), t('d', 'doing', 'a0')];

function apply(todos: ReturnType<typeof t>[], id: string, result: { status: TodoStatus; order: string } | null) {
  if (!result) return todos;
  return todos.map((x) => (x._id === id ? { ...x, ...result } : x));
}

const ids = (todos: ReturnType<typeof t>[], status: TodoStatus) => sortColumn(todos, status).map((x) => x._id);

describe('computeDrop', () => {
  it('다른 컬럼의 카드 위에 놓으면 그 카드 앞에 들어간다', () => {
    const r = computeDrop(base, 'b', { type: 'card', id: 'd' });
    expect(r?.status).toBe('doing');
    expect(ids(apply(base, 'b', r), 'doing')).toEqual(['b', 'd']);
    expect(ids(apply(base, 'b', r), 'todo')).toEqual(['a', 'c']);
  });

  it('같은 컬럼 아래로 이동 (a → c 자리)', () => {
    const r = computeDrop(base, 'a', { type: 'card', id: 'c' });
    expect(ids(apply(base, 'a', r), 'todo')).toEqual(['b', 'c', 'a']);
  });

  it('같은 컬럼 위로 이동 (c → a 자리)', () => {
    const r = computeDrop(base, 'c', { type: 'card', id: 'a' });
    expect(ids(apply(base, 'c', r), 'todo')).toEqual(['c', 'a', 'b']);
  });

  it('빈 컬럼에 놓기', () => {
    const r = computeDrop(base, 'a', { type: 'column', status: 'done' });
    expect(r?.status).toBe('done');
    expect(ids(apply(base, 'a', r), 'done')).toEqual(['a']);
  });

  it('컬럼 위에 놓으면 맨 뒤', () => {
    const r = computeDrop(base, 'd', { type: 'column', status: 'todo' });
    expect(ids(apply(base, 'd', r), 'todo')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('제자리면 null', () => {
    expect(computeDrop(base, 'a', { type: 'card', id: 'a' })).toBeNull();
    expect(computeDrop(base, 'c', { type: 'column', status: 'todo' })).toBeNull();
  });

  it('필터로 숨은 카드가 있어도 전체 목록 기준으로 겹치지 않는 키를 만든다', () => {
    // doing 컬럼: 보이는 v(a0), 숨은 h1(a1), h2(a2). 컬럼 위에 놓으면 숨은 카드 뒤로 가야 한다.
    const todos = [t('v', 'doing', 'a0'), t('h1', 'doing', 'a1'), t('h2', 'doing', 'a2'), t('x', 'todo', 'a0')];
    const r = computeDrop(todos, 'x', { type: 'column', status: 'doing' })!;
    expect(todos.map((x) => x.order)).not.toContain(r.order);
    expect(ids(apply(todos, 'x', r), 'doing')).toEqual(['v', 'h1', 'h2', 'x']);
  });

  it('High 우선순위는 위에 고정되고, 일반 카드는 High 영역에 끼어들지 않는다', () => {
    const todos = [t('h', 'todo', 'a5', 'high'), t('a', 'todo', 'a0'), t('b', 'todo', 'a1'), t('x', 'doing', 'a0')];
    expect(ids(todos, 'todo')).toEqual(['h', 'a', 'b']);
    // x를 h 위에 놓아도 일반 그룹의 맨 앞으로 간다
    const r = computeDrop(todos, 'x', { type: 'card', id: 'h' });
    expect(ids(apply(todos, 'x', r), 'todo')).toEqual(['h', 'x', 'a', 'b']);
  });
});
