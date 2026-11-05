import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { getSessionUserId } from '@/lib/session';
import { runAsUser } from '@/lib/userScope';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function assertId(id: unknown, label = 'id'): string {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw new HttpError(400, `잘못된 ${label}입니다.`);
  return id;
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new HttpError(400, '요청 본문이 올바른 JSON 객체가 아닙니다.');
  }
}

export type IdContext = { params: { id: string } };
type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * DB 연결 + 로그인 확인 + 공통 에러 처리.
 * 세션이 없거나 만료됐으면 401, 있으면 그 사용자의 컨텍스트에서 핸들러를 실행합니다
 * (모든 쿼리가 자동으로 본인 데이터로 제한됨, lib/userScope.ts).
 */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      await connectDB();
    } catch (err) {
      console.error(err);
      return json({ error: '데이터베이스에 연결할 수 없습니다.' }, 500);
    }
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return json({ error: '로그인이 필요합니다.' }, 401);
      return await runAsUser(userId, () => handler(req, ctx));
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

function toErrorResponse(err: unknown) {
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return json({ error: first?.message ?? '입력값이 올바르지 않습니다.' }, 400);
  }
  if (err instanceof mongoose.Error.CastError) return json({ error: `잘못된 값입니다: ${err.path}` }, 400);
  if (typeof err === 'object' && err && (err as { code?: number }).code === 11000) {
    return json({ error: '이미 존재하는 항목입니다.' }, 409);
  }
  console.error(err);
  return json({ error: '서버 오류가 발생했습니다.' }, 500);
}

// ---- 입력 검증 헬퍼 ----

export function optString(body: Record<string, unknown>, key: string, max = 5000): string | undefined {
  if (!(key in body) || body[key] === undefined) return undefined;
  const v = body[key];
  if (v === null) return '';
  if (typeof v !== 'string') throw new HttpError(400, `${key}는 문자열이어야 합니다.`);
  if (v.length > max) throw new HttpError(400, `${key}가 너무 깁니다.`);
  return v;
}

export function reqTitle(body: Record<string, unknown>, key = 'title'): string {
  const v = optString(body, key, 200)?.trim();
  if (!v) throw new HttpError(400, `${key}은(는) 필수입니다.`);
  return v;
}

/** undefined = 변경 없음, null = 연결 해제 */
export function optRef(body: Record<string, unknown>, key: string): string | null | undefined {
  if (!(key in body) || body[key] === undefined) return undefined;
  const v = body[key];
  if (v === null || v === '') return null;
  return assertId(v, key);
}

export function optEnum<T extends string>(body: Record<string, unknown>, key: string, values: readonly T[]): T | undefined {
  if (!(key in body) || body[key] === undefined) return undefined;
  const v = body[key];
  if (typeof v !== 'string' || !values.includes(v as T)) {
    throw new HttpError(400, `${key}는 ${values.join(', ')} 중 하나여야 합니다.`);
  }
  return v as T;
}
