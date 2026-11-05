import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
// @ts-expect-error 순수 JS 스크립트 (타입 선언 없음)
import { countMissing, migrateUserId } from '../scripts/migrate-user-id.mjs';

// mongoose가 포함한 드라이버를 그대로 씁니다 (별도 의존성 없음).
const { MongoClient, ObjectId } = mongoose.mongo;
type Db = mongoose.mongo.Db;

let server: MongoMemoryServer;
let client: mongoose.mongo.MongoClient;
let db: Db;
const owner = new ObjectId();

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  client = await MongoClient.connect(server.getUri());
  db = client.db('migrate');
});
afterAll(async () => {
  await client.close();
  await server.stop();
});

/** 로그인 기능 이전 상태: userId 없는 문서 + 예전 unique(weekStart) 인덱스 */
beforeEach(async () => {
  await db.dropDatabase();
  await db.collection('users').insertOne({ _id: owner, githubId: 1, username: 'oksusu', avatarUrl: '' });
  await db.collection('weeklyplans').createIndex({ weekStart: 1 }, { unique: true });
  await db.collection('goals').insertMany([{ title: 'g1' }, { title: 'g2' }]);
  await db.collection('weeklyplans').insertOne({ weekStart: new Date('2026-11-02T00:00:00Z'), goals: [] });
  await db.collection('todos').insertMany([{ title: 't1', status: 'todo', order: 'a0' }, { title: 't2', status: 'done', order: 'a0', userId: null }]);
});

describe('migrate-user-id', () => {
  it('인자 없이 실행하면 개수만 보고하고 아무것도 쓰지 않는다', async () => {
    const r = await migrateUserId(db, undefined);
    expect(r).toEqual({ dryRun: true, before: { goals: 2, weeklyplans: 1, todos: 2 } });
    expect(await countMissing(db)).toEqual({ goals: 2, weeklyplans: 1, todos: 2 });
    const names = (await db.collection('weeklyplans').indexes()).map((i) => i.name);
    expect(names).toContain('weekStart_1');
  });

  it('없는 사용자면 실패하고 아무것도 쓰지 않는다', async () => {
    await expect(migrateUserId(db, 'nobody')).rejects.toThrow('찾을 수 없습니다');
    expect(await countMissing(db)).toEqual({ goals: 2, weeklyplans: 1, todos: 2 });
  });

  it('사용자에게 모두 연결하고, 예전 인덱스를 복합 unique 인덱스로 바꾼다', async () => {
    const r = await migrateUserId(db, 'oksusu');
    expect(r.updated).toEqual({ goals: 2, weeklyplans: 1, todos: 2 });
    expect(r.after).toEqual({ goals: 0, weeklyplans: 0, todos: 0 });
    expect(r.droppedIndexes).toEqual(['weekStart_1']);
    for (const name of ['goals', 'weeklyplans', 'todos']) {
      const docs = await db.collection(name).find().toArray();
      expect(docs.every((d) => owner.equals(d.userId))).toBe(true);
    }
    const idx = await db.collection('weeklyplans').indexes();
    expect(idx.find((i) => i.name === 'weekStart_1')).toBeUndefined();
    expect(idx.find((i) => JSON.stringify(i.key) === JSON.stringify({ userId: 1, weekStart: 1 }))?.unique).toBe(true);
  });

  it('두 번 실행해도 바뀌는 것이 없다 (멱등)', async () => {
    await migrateUserId(db, 'oksusu');
    const snapshot = await db.collection('todos').find().toArray();
    const r = await migrateUserId(db, 'oksusu');
    expect(r.before).toEqual({ goals: 0, weeklyplans: 0, todos: 0 });
    expect(r.updated).toEqual({ goals: 0, weeklyplans: 0, todos: 0 });
    expect(r.droppedIndexes).toEqual([]);
    expect(await db.collection('todos').find().toArray()).toEqual(snapshot);
  });

  it('이미 다른 사용자 소유인 문서는 건드리지 않는다', async () => {
    const other = new ObjectId();
    await db.collection('goals').insertOne({ title: '남의 것', userId: other });
    await migrateUserId(db, 'oksusu');
    expect(other.equals((await db.collection('goals').findOne({ title: '남의 것' }))!.userId)).toBe(true);
  });

  it('같은 주의 계획이 사용자에게 이미 있으면 쓰기 전에 중단한다', async () => {
    await db.collection('weeklyplans').dropIndex('weekStart_1');
    await db.collection('weeklyplans').insertOne({ weekStart: new Date('2026-11-02T00:00:00Z'), goals: [], userId: owner });
    await expect(migrateUserId(db, 'oksusu')).rejects.toThrow('2026-11-02');
    expect(await countMissing(db)).toEqual({ goals: 2, weeklyplans: 1, todos: 2 });
  });
});
