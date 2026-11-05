import mongoose from 'mongoose';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

// 개발 중 HMR로 모듈이 다시 평가돼도 연결을 하나만 유지하도록 globalThis에 캐시합니다.
export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI가 설정되지 않았습니다. .env를 확인하세요 (.env.example 참고).');
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false }).catch((err) => {
      cache.promise = null;
      throw err;
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/** 테스트에서 연결 캐시를 초기화할 때 사용합니다. */
export async function disconnectDB(): Promise<void> {
  if (cache.conn) await cache.conn.disconnect();
  cache.conn = null;
  cache.promise = null;
}
