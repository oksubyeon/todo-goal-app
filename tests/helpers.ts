import mongoose from 'mongoose';
import { User } from '@/models/User';
import { createSession, SESSION_COOKIE } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';

/** 테스트마다 빈 DB에서 시작 (unique 인덱스까지 다시 만들어 409 검사가 동작하게 함) */
export async function resetDb() {
  await connectDB();
  await mongoose.connection.db!.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

let nextGithubId = 1000;

/** GitHub 로그인을 마친 것과 같은 사용자 + 세션을 만들고 요청에 쓸 Cookie 헤더를 돌려줍니다. */
export async function loginAs(username: string) {
  const user = await User.create({ githubId: nextGithubId++, username, avatarUrl: `https://avatars.example/${username}` });
  const token = await createSession(String(user._id));
  return { userId: String(user._id), token, cookie: `${SESSION_COOKIE}=${token}` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHandler = (req: Request, ctx: any) => Promise<Response>;

export async function callHandler(
  handler: AnyHandler,
  opts: { url?: string; body?: unknown; id?: string; cookie?: string | null; method?: string } = {},
) {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method: opts.method ?? 'POST', headers };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    headers['content-type'] = 'application/json';
  }
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await handler(new Request(`http://test${opts.url ?? '/'}`, init), { params: { id: opts.id ?? '' } });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: body as any, headers: res.headers };
}
