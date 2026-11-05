// 로그인 기능 이전에 만든 데이터(userId 없음)를 GitHub 사용자에게 연결하는 마이그레이션.
//
//   npm run migrate:user-id               # 확인만 (userId 없는 문서 수 출력, 쓰기 없음)
//   npm run migrate:user-id -- <GitHub아이디>  # 그 사용자에게 연결 (먼저 한 번 로그인해야 함)
//
// 여러 번 실행해도 안전합니다 (이미 연결된 문서는 건드리지 않음).
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';

export const COLLECTIONS = ['goals', 'weeklyplans', 'todos'];
const MISSING = { $or: [{ userId: { $exists: false } }, { userId: null }] };

export async function countMissing(db) {
  const counts = {};
  for (const name of COLLECTIONS) counts[name] = await db.collection(name).countDocuments(MISSING);
  return counts;
}

/** weeklyplans: 예전 { weekStart } unique 인덱스를 지우고 { userId, weekStart } unique 인덱스를 보장 */
async function fixWeeklyIndexes(db) {
  const coll = db.collection('weeklyplans');
  const dropped = [];
  const indexes = await coll.indexes().catch(() => []);
  for (const idx of indexes) {
    const keys = Object.keys(idx.key);
    if (idx.unique && keys.length === 1 && keys[0] === 'weekStart') {
      await coll.dropIndex(idx.name);
      dropped.push(idx.name);
    }
  }
  await coll.createIndex({ userId: 1, weekStart: 1 }, { unique: true });
  for (const name of COLLECTIONS) await db.collection(name).createIndex({ userId: 1 });
  return dropped;
}

/**
 * username이 없으면 확인만 합니다. 있으면 userId가 없는 문서를 모두 그 사용자에게 연결합니다.
 * 실패 조건(쓰기 전에 검사): 사용자를 찾을 수 없음, 같은 주의 주간 계획이 이미 그 사용자에게 있음.
 */
export async function migrateUserId(db, username) {
  const before = await countMissing(db);
  if (!username) return { dryRun: true, before };

  const users = await db.collection('users').find({ username }).toArray();
  if (users.length !== 1) {
    throw new Error(
      users.length === 0
        ? `GitHub 사용자 '${username}'를 찾을 수 없습니다. 앱에서 그 계정으로 한 번 로그인한 뒤 다시 실행하세요.`
        : `'${username}' 이름의 사용자가 ${users.length}명입니다. 데이터를 확인하세요.`,
    );
  }
  const userId = users[0]._id;

  // 같은 주의 계획이 양쪽에 있으면 합칠 수 없으므로 아무것도 쓰지 않고 중단합니다.
  const orphanWeeks = await db.collection('weeklyplans').distinct('weekStart', MISSING);
  if (orphanWeeks.length) {
    const clash = await db.collection('weeklyplans').find({ userId, weekStart: { $in: orphanWeeks } }).project({ weekStart: 1 }).toArray();
    if (clash.length) {
      const weeks = clash.map((p) => p.weekStart.toISOString().slice(0, 10)).join(', ');
      throw new Error(`'${username}'에게 이미 같은 주의 주간 계획이 있습니다: ${weeks}. 한쪽을 지운 뒤 다시 실행하세요.`);
    }
  }

  // 예전 unique(weekStart) 인덱스가 남아 있으면 먼저 정리합니다.
  const droppedIndexes = await fixWeeklyIndexes(db);
  const updated = {};
  for (const name of COLLECTIONS) {
    const r = await db.collection(name).updateMany(MISSING, { $set: { userId } });
    updated[name] = r.modifiedCount;
  }
  return { dryRun: false, username, before, updated, droppedIndexes, after: await countMissing(db) };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI가 없습니다. .env를 확인하세요.');
    process.exit(1);
  }
  const username = process.argv[2];
  await mongoose.connect(uri);
  try {
    const result = await migrateUserId(mongoose.connection.db, username);
    console.log('userId 없는 문서:', result.before);
    if (result.dryRun) {
      console.log('\n확인만 했습니다. 연결하려면: npm run migrate:user-id -- <GitHub아이디>');
    } else {
      console.log(`'${result.username}'에게 연결:`, result.updated);
      if (result.droppedIndexes.length) console.log('삭제한 예전 인덱스:', result.droppedIndexes.join(', '));
      console.log('남은 문서:', result.after);
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
