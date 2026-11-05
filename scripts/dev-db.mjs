// 로컬에 MongoDB가 없을 때 쓰는 개발용 DB. 데이터는 .mongo-data/에 저장돼 재시작해도 유지됩니다.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdirSync } from 'node:fs';

const port = Number(process.env.DEV_DB_PORT ?? 27018);
const dbPath = new URL('../.mongo-data', import.meta.url);
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port, dbPath: decodeURIComponent(dbPath.pathname.replace(/^\/([A-Za-z]:)/, '$1')), storageEngine: 'wiredTiger' },
});
console.log(`개발용 MongoDB 실행 중: ${server.getUri()}todo-goal-app`);
console.log('종료하려면 Ctrl+C');

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
