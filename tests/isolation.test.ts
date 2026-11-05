import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { disconnectDB } from '@/lib/mongodb';
import { runAsUser } from '@/lib/userScope';
import { hashToken } from '@/lib/session';
import { Goal } from '@/models/Goal';
import { Todo } from '@/models/Todo';
import { Session } from '@/models/Session';
import * as goals from '@/app/api/goals/route';
import * as goal from '@/app/api/goals/[id]/route';
import * as weeklyList from '@/app/api/weekly/route';
import * as weekly from '@/app/api/weekly/[id]/route';
import * as todos from '@/app/api/todos/route';
import * as todo from '@/app/api/todos/[id]/route';
import { callHandler, loginAs, resetDb } from './helpers';

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('isolation');
});
afterAll(async () => {
  await disconnectDB();
  await server.stop();
});
beforeEach(resetDb);

const fakeId = '64b7f0000000000000000000';

describe('로그인하지 않은 요청은 401', () => {
  const handlers = [
    ['GET /api/goals', goals.GET],
    ['POST /api/goals', goals.POST],
    ['GET /api/goals/[id]', goal.GET],
    ['PUT /api/goals/[id]', goal.PUT],
    ['DELETE /api/goals/[id]', goal.DELETE],
    ['GET /api/weekly', weeklyList.GET],
    ['POST /api/weekly', weeklyList.POST],
    ['GET /api/weekly/[id]', weekly.GET],
    ['PUT /api/weekly/[id]', weekly.PUT],
    ['PATCH /api/weekly/[id]', weekly.PATCH],
    ['DELETE /api/weekly/[id]', weekly.DELETE],
    ['GET /api/todos', todos.GET],
    ['POST /api/todos', todos.POST],
    ['GET /api/todos/[id]', todo.GET],
    ['PUT /api/todos/[id]', todo.PUT],
    ['PATCH /api/todos/[id]', todo.PATCH],
    ['DELETE /api/todos/[id]', todo.DELETE],
  ] as const;

  it.each(handlers)('%s: 쿠키 없음', async (_name, handler) => {
    const r = await callHandler(handler, { id: fakeId, body: { title: 't' } });
    expect(r.status).toBe(401);
    expect(r.body.error).toBeTruthy();
  });

  it('알 수 없는 토큰', async () => {
    expect((await callHandler(todos.GET, { cookie: 'sid=nope' })).status).toBe(401);
  });

  it('만료된 세션', async () => {
    const { userId } = await loginAs('old');
    await Session.create({ tokenHash: hashToken('expired-token'), userId, expiresAt: new Date(Date.now() - 1000) });
    expect((await callHandler(todos.GET, { cookie: 'sid=expired-token' })).status).toBe(401);
  });

  it('401일 때는 아무것도 만들어지지 않는다', async () => {
    await callHandler(goals.POST, { body: { title: '몰래 만들기' } });
    expect(await mongoose.connection.db!.collection('goals').countDocuments()).toBe(0);
  });
});

describe('사용자별 데이터 격리', () => {
  it('B는 A의 목표/주간 계획/할 일을 조회·수정·삭제할 수 없다', async () => {
    const a = await loginAs('alice');
    const b = await loginAs('bob');
    const asA = (h: Parameters<typeof callHandler>[0], o: Parameters<typeof callHandler>[1] = {}) => callHandler(h, { ...o, cookie: a.cookie });
    const asB = (h: Parameters<typeof callHandler>[0], o: Parameters<typeof callHandler>[1] = {}) => callHandler(h, { ...o, cookie: b.cookie });

    const g = (await asA(goals.POST, { body: { title: 'A 목표' } })).body;
    const w = (await asA(weeklyList.POST, { body: { weekStart: '2026-11-02', goals: ['A 주간'], goalId: g._id } })).body;
    const t = (await asA(todos.POST, { body: { title: 'A 할 일', goalId: g._id, weeklyPlanId: w._id } })).body;

    // 목록에 보이지 않음
    expect((await asB(goals.GET)).body).toEqual([]);
    expect((await asB(weeklyList.GET)).body).toEqual([]);
    expect((await asB(todos.GET)).body).toEqual([]);

    // 단건 조회/수정/삭제는 404
    for (const [h, id, body] of [
      [goal.GET, g._id, undefined],
      [goal.PUT, g._id, { title: '해킹' }],
      [goal.DELETE, g._id, undefined],
      [weekly.GET, w._id, undefined],
      [weekly.PUT, w._id, { memo: '해킹' }],
      [weekly.PATCH, w._id, { goalIndex: 0, done: true }],
      [weekly.DELETE, w._id, undefined],
      [todo.GET, t._id, undefined],
      [todo.PUT, t._id, { title: '해킹' }],
      [todo.PATCH, t._id, { status: 'done', order: 'a5' }],
      [todo.DELETE, t._id, undefined],
    ] as const) {
      const r = await asB(h, { id, body });
      expect(r.status, `${h.name} ${id}`).toBe(404);
    }

    // A의 id를 참조해 B의 할 일을 만들 수도 없다
    expect((await asB(todos.POST, { body: { title: 'x', goalId: g._id } })).status).toBe(400);
    expect((await asB(todos.POST, { body: { title: 'x', weeklyPlanId: w._id } })).status).toBe(400);
    expect((await asB(weeklyList.POST, { body: { weekStart: '2026-11-09', goalId: g._id } })).status).toBe(400);

    // A의 데이터는 그대로
    expect((await asA(goal.GET, { id: g._id })).body.title).toBe('A 목표');
    expect((await asA(weekly.GET, { id: w._id })).body).toMatchObject({ memo: '', goals: [{ text: 'A 주간', done: false }] });
    expect((await asA(todo.GET, { id: t._id })).body).toMatchObject({ title: 'A 할 일', status: 'todo' });
  });

  it('두 사용자가 같은 주의 주간 계획을 각각 만들 수 있다 (사용자 안에서는 409 유지)', async () => {
    const a = await loginAs('alice');
    const b = await loginAs('bob');
    expect((await callHandler(weeklyList.POST, { cookie: a.cookie, body: { weekStart: '2026-11-02' } })).status).toBe(201);
    expect((await callHandler(weeklyList.POST, { cookie: b.cookie, body: { weekStart: '2026-11-02' } })).status).toBe(201);
    expect((await callHandler(weeklyList.POST, { cookie: b.cookie, body: { weekStart: '2026-11-04' } })).status).toBe(409);
  });

  it('진행률은 본인 할 일만 센다', async () => {
    const a = await loginAs('alice');
    const b = await loginAs('bob');
    const ga = (await callHandler(goals.POST, { cookie: a.cookie, body: { title: 'A' } })).body;
    const wa = (await callHandler(weeklyList.POST, { cookie: a.cookie, body: { weekStart: '2026-11-02' } })).body;
    await callHandler(todos.POST, { cookie: a.cookie, body: { title: '1', status: 'done', goalId: ga._id, weeklyPlanId: wa._id } });
    await callHandler(todos.POST, { cookie: a.cookie, body: { title: '2', goalId: ga._id, weeklyPlanId: wa._id } });
    // B의 할 일이 많아도 A의 진행률에 영향 없음
    for (let i = 0; i < 3; i++) await callHandler(todos.POST, { cookie: b.cookie, body: { title: 'b', status: 'done' } });
    expect((await callHandler(goals.GET, { cookie: a.cookie })).body[0]).toMatchObject({ todoCount: 2, doneCount: 1, progress: 50 });
    expect((await callHandler(weekly.GET, { cookie: a.cookie, id: wa._id })).body).toMatchObject({ todoTotal: 2, todoDone: 1 });
  });

  it('새 할 일은 본인 컬럼 맨 뒤에 붙는다 (다른 사용자 order와 섞이지 않음)', async () => {
    const a = await loginAs('alice');
    const b = await loginAs('bob');
    for (let i = 0; i < 5; i++) await callHandler(todos.POST, { cookie: a.cookie, body: { title: `a${i}` } });
    const first = (await callHandler(todos.POST, { cookie: b.cookie, body: { title: 'b0' } })).body;
    const firstOfA = (await callHandler(todos.GET, { cookie: a.cookie })).body[0];
    expect(first.order).toBe(firstOfA.order); // 각자 빈 컬럼에서 시작하므로 첫 키가 같다
  });
});

describe('사용자 범위 계층 (lib/userScope)', () => {
  it('컨텍스트 밖의 쿼리는 예외 (fail closed)', async () => {
    await expect(Goal.find().lean()).rejects.toThrow('사용자 컨텍스트');
    await expect(Todo.aggregate([{ $match: {} }])).rejects.toThrow('사용자 컨텍스트');
    await expect(Goal.create({ title: 'x' })).rejects.toThrow('사용자 컨텍스트');
  });

  it('모듈이 다시 평가돼도(Next.js 라우트 번들/HMR) 같은 사용자 컨텍스트를 본다', async () => {
    const a = await loginAs('alice');
    await runAsUser(a.userId, async () => {
      await Goal.create({ title: '원래 모듈로 만든 목표' });
    });
    vi.resetModules();
    const fresh = await import('@/lib/userScope');
    expect(fresh.runAsUser).not.toBe(runAsUser); // 정말 새 모듈 인스턴스
    // Goal 모델의 훅은 처음 모듈에서 등록됐지만, 새 모듈의 runAsUser로도 동작해야 한다
    const found = await fresh.runAsUser(a.userId, async () => Goal.find().lean());
    expect(found.map((g) => g.title)).toEqual(['원래 모듈로 만든 목표']);
  });

  it('생성 시 현재 사용자를 소유자로 저장하고, 업데이트로 소유자를 바꿀 수 없다', async () => {
    const a = await loginAs('alice');
    const b = await loginAs('bob');
    const created = await runAsUser(a.userId, () => Goal.create({ title: 'g', userId: b.userId }));
    expect(String(created.get('userId'))).toBe(a.userId);
    // 쿼리는 await하는 시점에 실행되므로 컨텍스트 안에서 await해야 합니다 (route()의 async 핸들러와 같음).
    await runAsUser(a.userId, async () => {
      await Goal.updateOne({ _id: created._id }, { $set: { userId: b.userId, title: 'g2' } });
    });
    const raw = await mongoose.connection.db!.collection('goals').findOne({ _id: created._id });
    expect(String(raw!.userId)).toBe(a.userId);
    expect(raw!.title).toBe('g2');
  });
});
