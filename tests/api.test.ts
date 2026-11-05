import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectDB } from '@/lib/mongodb';
import { callHandler, loginAs, resetDb, type AnyHandler } from './helpers';
import * as goals from '@/app/api/goals/route';
import * as goal from '@/app/api/goals/[id]/route';
import * as weeklyList from '@/app/api/weekly/route';
import * as weekly from '@/app/api/weekly/[id]/route';
import * as todos from '@/app/api/todos/route';
import * as todo from '@/app/api/todos/[id]/route';

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('test');
});

afterAll(async () => {
  await disconnectDB();
  await server.stop();
});

// 모든 기존 테스트는 로그인한 사용자 한 명으로 실행합니다.
let cookie = '';

beforeEach(async () => {
  await resetDb();
  cookie = (await loginAs('tester')).cookie;
});

const call = (handler: AnyHandler, opts: { url?: string; body?: unknown; id?: string } = {}) =>
  callHandler(handler, { ...opts, cookie });

const fakeId = '64b7f0000000000000000000';

describe('goals API', () => {
  it('CRUD', async () => {
    const created = await call(goals.POST, { body: { title: '  영어 공부 ', description: '토익 900' } });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: '영어 공부', description: '토익 900', progress: 0 });
    const id = created.body._id;

    const list = await call(goals.GET);
    expect(list.body).toHaveLength(1);

    const updated = await call(goal.PUT, { id, body: { title: '영어', description: '' } });
    expect(updated.body).toMatchObject({ title: '영어', description: '' });

    expect((await call(goal.GET, { id })).body.title).toBe('영어');
    expect((await call(goal.DELETE, { id })).status).toBe(200);
    expect((await call(goal.GET, { id })).status).toBe(404);
  });

  it('검증: 빈 제목 400, 잘못된 ObjectId 400, 잘못된 JSON 400', async () => {
    expect((await call(goals.POST, { body: { title: '   ' } })).status).toBe(400);
    expect((await call(goal.GET, { id: 'abc' })).status).toBe(400);
    expect((await call(goals.POST, { body: 'not json' })).status).toBe(400);
    const r = await call(goal.GET, { id: fakeId });
    expect(r.status).toBe(404);
    expect(r.body.error).toBeTruthy();
  });

  it('목표 진행률 = 연결된 할 일 중 완료 비율', async () => {
    const g = (await call(goals.POST, { body: { title: 'g' } })).body;
    for (const status of ['done', 'done', 'todo', 'doing']) {
      await call(todos.POST, { body: { title: 't', status, goalId: g._id } });
    }
    const list = (await call(goals.GET)).body;
    expect(list[0]).toMatchObject({ todoCount: 4, doneCount: 2, progress: 50 });
  });

  it('목표 삭제 시 할 일과 주간 계획의 goalId만 끊긴다', async () => {
    const g = (await call(goals.POST, { body: { title: 'g' } })).body;
    const w = (await call(weeklyList.POST, { body: { weekStart: '2026-11-02', goalId: g._id } })).body;
    const t = (await call(todos.POST, { body: { title: 't', goalId: g._id } })).body;
    await call(goal.DELETE, { id: g._id });
    expect((await call(todo.GET, { id: t._id })).body.goalId).toBeNull();
    expect((await call(weekly.GET, { id: w._id })).body.goalId).toBeNull();
  });
});

describe('weekly API', () => {
  it('생성/조회/수정/삭제 + weekStart를 월요일로 정규화', async () => {
    const created = await call(weeklyList.POST, {
      body: { weekStart: '2026-11-05', goals: ['운동 3회', { text: '책 1권', done: true }], memo: 'm' },
    });
    expect(created.status).toBe(201);
    expect(created.body.weekStart).toBe('2026-11-02T00:00:00.000Z');
    expect(created.body.goals).toHaveLength(2);
    const id = created.body._id;

    const byWeek = await call(weeklyList.GET, { url: '/api/weekly?weekStart=2026-11-02' });
    expect(byWeek.body).toHaveLength(1);
    expect((await call(weeklyList.GET, { url: '/api/weekly?weekStart=2026-11-09' })).body).toHaveLength(0);

    const updated = await call(weekly.PUT, { id, body: { memo: '새 메모', retrospective: '잘함' } });
    expect(updated.body).toMatchObject({ memo: '새 메모', retrospective: '잘함' });
    expect(updated.body.goals).toHaveLength(2);

    expect((await call(weekly.DELETE, { id })).status).toBe(200);
    expect((await call(weekly.GET, { id })).status).toBe(404);
  });

  it('존재하지 않는 goalId는 400', async () => {
    expect((await call(weeklyList.POST, { body: { weekStart: '2026-11-02', goalId: fakeId } })).status).toBe(400);
    const w = (await call(weeklyList.POST, { body: { weekStart: '2026-11-02' } })).body;
    expect((await call(weekly.PUT, { id: w._id, body: { goalId: fakeId } })).status).toBe(400);
  });

  it('같은 주 중복 생성은 409', async () => {
    await call(weeklyList.POST, { body: { weekStart: '2026-11-02' } });
    const dup = await call(weeklyList.POST, { body: { weekStart: '2026-11-08' } });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toContain('이미');
  });

  it('주간 목표 6개는 400', async () => {
    const r = await call(weeklyList.POST, { body: { weekStart: '2026-11-02', goals: ['1', '2', '3', '4', '5', '6'] } });
    expect(r.status).toBe(400);
    const ok = await call(weeklyList.POST, { body: { weekStart: '2026-11-02', goals: ['1', '2', '3', '4', '5'] } });
    expect(ok.status).toBe(201);
    expect((await call(weekly.PUT, { id: ok.body._id, body: { goals: ['1', '2', '3', '4', '5', '6'] } })).status).toBe(400);
  });

  it('PATCH goals[n].done 토글이 응답에 반영된다', async () => {
    const w = (await call(weeklyList.POST, { body: { weekStart: '2026-11-02', goals: ['a', 'b'] } })).body;
    const r = await call(weekly.PATCH, { id: w._id, body: { goalIndex: 1, done: true } });
    expect(r.status).toBe(200);
    expect(r.body.goals.map((g: { done: boolean }) => g.done)).toEqual([false, true]);
    expect((await call(weekly.PATCH, { id: w._id, body: { goalIndex: 5, done: true } })).status).toBe(400);
    expect((await call(weekly.PATCH, { id: w._id, body: { goalIndex: 0, done: 'yes' } })).status).toBe(400);
  });

  it('주간 진행률 = 그 주 할 일 중 완료 비율, 삭제 시 할 일 연결 해제', async () => {
    const w = (await call(weeklyList.POST, { body: { weekStart: '2026-11-02' } })).body;
    const ids: string[] = [];
    for (const status of ['done', 'done', 'todo', 'todo']) {
      ids.push((await call(todos.POST, { body: { title: 't', status, weeklyPlanId: w._id, dayOfWeek: 1 } })).body._id);
    }
    const r = await call(weekly.GET, { id: w._id });
    expect(r.body).toMatchObject({ todoTotal: 4, todoDone: 2, todoProgress: 50 });
    await call(weekly.DELETE, { id: w._id });
    const t = (await call(todo.GET, { id: ids[0] })).body;
    expect(t.weeklyPlanId).toBeNull();
    expect(t.dayOfWeek).toBeNull();
  });
});

describe('todos API', () => {
  it('CRUD + 기본값', async () => {
    const created = await call(todos.POST, { body: { title: '할 일' } });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: '할 일', status: 'todo', priority: 'medium', dueDate: null });
    expect(typeof created.body.order).toBe('string');
    const id = created.body._id;

    const updated = await call(todo.PUT, {
      id,
      body: { title: '수정', priority: 'high', dueDate: '2026-11-10', dayOfWeek: 3, description: 'd' },
    });
    expect(updated.body).toMatchObject({ title: '수정', priority: 'high', dayOfWeek: 3, dueDate: '2026-11-10T00:00:00.000Z' });

    expect((await call(todo.DELETE, { id })).status).toBe(200);
    expect((await call(todo.GET, { id })).status).toBe(404);
  });

  it('새 할 일은 같은 컬럼 맨 뒤에 붙는다', async () => {
    const a = (await call(todos.POST, { body: { title: 'a' } })).body;
    const b = (await call(todos.POST, { body: { title: 'b' } })).body;
    expect(a.order < b.order).toBe(true);
  });

  it('PATCH {status, order}가 저장되고 정렬에 반영된다', async () => {
    const a = (await call(todos.POST, { body: { title: 'a' } })).body;
    const b = (await call(todos.POST, { body: { title: 'b', status: 'doing' } })).body;
    // a를 doing 컬럼의 b 앞으로 이동
    const moved = await call(todo.PATCH, { id: a._id, body: { status: 'doing', order: 'Zz' } });
    expect(moved.body).toMatchObject({ status: 'doing', order: 'Zz' });
    const list = (await call(todos.GET, { url: '/api/todos?status=doing' })).body;
    expect(list.map((t: { _id: string }) => t._id)).toEqual([a._id, b._id]);
  });

  it('order 없이 status만 바꾸면 새 컬럼 맨 뒤로 간다', async () => {
    const d = (await call(todos.POST, { body: { title: 'd', status: 'done' } })).body;
    const a = (await call(todos.POST, { body: { title: 'a' } })).body;
    const moved = (await call(todo.PUT, { id: a._id, body: { status: 'done' } })).body;
    expect(moved.order > d.order).toBe(true);
  });

  it('필터: weeklyPlanId, goalId', async () => {
    const w = (await call(weeklyList.POST, { body: { weekStart: '2026-11-02' } })).body;
    const g = (await call(goals.POST, { body: { title: 'g' } })).body;
    await call(todos.POST, { body: { title: '1', weeklyPlanId: w._id } });
    await call(todos.POST, { body: { title: '2', goalId: g._id } });
    await call(todos.POST, { body: { title: '3' } });
    expect((await call(todos.GET, { url: `/api/todos?weeklyPlanId=${w._id}` })).body).toHaveLength(1);
    expect((await call(todos.GET, { url: `/api/todos?goalId=${g._id}` })).body).toHaveLength(1);
    expect((await call(todos.GET)).body).toHaveLength(3);
  });

  it('검증: 빈 제목/잘못된 status/dayOfWeek/order/참조는 400', async () => {
    const bad = [
      { title: '' },
      { title: 't', status: 'finished' },
      { title: 't', priority: 'urgent' },
      { title: 't', dayOfWeek: 7 },
      { title: 't', order: 'a b' },
      { title: 't', order: '0' },
      { title: 't', dueDate: '11/10' },
      { title: 't', goalId: 'xyz' },
      { title: 't', goalId: fakeId },
      { title: 't', weeklyPlanId: fakeId },
    ];
    for (const body of bad) {
      const r = await call(todos.POST, { body });
      expect(r.status, JSON.stringify(body)).toBe(400);
      expect(typeof r.body.error).toBe('string');
    }
    expect((await call(todo.PATCH, { id: fakeId, body: { status: 'done' } })).status).toBe(404);
  });
});

describe('DB 연결 실패', () => {
  it('MONGODB_URI가 없으면 500', async () => {
    const uri = process.env.MONGODB_URI;
    await disconnectDB();
    delete process.env.MONGODB_URI;
    try {
      const r = await call(goals.GET);
      expect(r.status).toBe(500);
    } finally {
      process.env.MONGODB_URI = uri;
    }
  });
});
