import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose, { type Schema } from 'mongoose';

/**
 * 요청별 사용자 컨텍스트.
 * API 요청은 route()가 세션을 확인한 뒤 runAsUser() 안에서 핸들러를 실행합니다.
 * 그러면 아래 플러그인이 모든 쿼리에 { userId }를 붙여서, 기존 CRUD 코드를 바꾸지 않고도
 * 사용자는 자기 데이터만 보고 고칠 수 있습니다.
 */
// Next.js는 이 모듈을 라우트 번들마다(그리고 개발 중 다시 컴파일할 때마다) 새로 평가하지만,
// Mongoose 모델과 플러그인 훅은 전역에 한 번만 등록됩니다. 저장소가 모듈마다 다르면
// route()가 넣은 사용자를 훅이 보지 못하므로, DB 연결 캐시처럼 globalThis에 하나만 둡니다.
const globalForScope = globalThis as unknown as { _userScopeStorage?: AsyncLocalStorage<{ userId: string }> };
const storage = (globalForScope._userScopeStorage ??= new AsyncLocalStorage<{ userId: string }>());

export function runAsUser<T>(userId: string, fn: () => T): T {
  return storage.run({ userId }, fn);
}

/** 컨텍스트가 없으면 예외. 다른 사용자 데이터가 새어 나가지 않도록 실패하는 쪽을 택합니다. */
export function currentUserId(): string {
  const store = storage.getStore();
  if (!store) throw new Error('사용자 컨텍스트 없이 사용자 데이터에 접근할 수 없습니다.');
  return store.userId;
}

const QUERY_OPS = [
  'countDocuments',
  'deleteMany',
  'deleteOne',
  'distinct',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndReplace',
  'findOneAndUpdate',
  'replaceOne',
  'updateMany',
  'updateOne',
] as const;

/** Goal / WeeklyPlan / Todo에 적용: userId 필드 추가 + 모든 쿼리를 현재 사용자로 제한 */
export function userScopePlugin(schema: Schema) {
  schema.add({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true } });

  schema.pre([...QUERY_OPS], { document: false, query: true }, function () {
    this.where({ userId: currentUserId() });
    // 업데이트로 소유자를 바꾸지 못하게 합니다.
    const update = this.getUpdate() as Record<string, unknown> | null;
    if (update && !Array.isArray(update)) {
      delete update.userId;
      const $set = update.$set as Record<string, unknown> | undefined;
      if ($set) delete $set.userId;
    }
  });

  schema.pre('aggregate', function () {
    this.pipeline().unshift({ $match: { userId: new mongoose.Types.ObjectId(currentUserId()) } });
  });

  schema.pre('validate', function () {
    // 새 문서는 현재 사용자 소유로 만듭니다. 이미 있는 문서의 소유자는 바꾸지 않습니다.
    if (this.isNew) this.set('userId', currentUserId());
  });

  schema.pre('insertMany', function (next: (err?: Error) => void, docs: Record<string, unknown>[]) {
    try {
      const userId = currentUserId();
      for (const doc of docs) doc.userId = userId;
      next();
    } catch (err) {
      next(err as Error);
    }
  });
}
