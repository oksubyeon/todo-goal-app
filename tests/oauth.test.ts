import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Session } from '@/models/Session';
import * as start from '@/app/auth/github/route';
import * as callback from '@/app/auth/github/callback/route';
import * as logout from '@/app/auth/logout/route';
import * as me from '@/app/api/me/route';
import * as todos from '@/app/api/todos/route';
import { safeNextPath } from '@/lib/github';
import { callHandler, resetDb } from './helpers';

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri('oauth');
});
afterAll(async () => {
  await disconnectDB();
  await server.stop();
});
beforeEach(async () => {
  process.env.GITHUB_CLIENT_ID = 'test-client-id';
  process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
  delete process.env.APP_URL;
  await resetDb();
});
afterEach(() => vi.unstubAllGlobals());

/** GitHub API만 가짜로 응답합니다. */
function mockGithub(user: { id: number; login: string; avatar_url: string } | null, tokenOk = true) {
  const fn = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (u === 'https://github.com/login/oauth/access_token') {
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({ client_id: 'test-client-id', client_secret: 'test-client-secret', code: 'the-code' });
      return Response.json(tokenOk ? { access_token: 'gho_token' } : { error: 'bad_verification_code' });
    }
    if (u === 'https://api.github.com/user') {
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer gho_token');
      return user ? Response.json(user) : Response.json({ message: 'Bad credentials' }, { status: 401 });
    }
    throw new Error('unexpected fetch ' + u);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function get(handler: (req: Request) => Promise<Response>, url: string, cookie?: string) {
  return handler(new Request(`http://localhost:3000${url}`, { headers: cookie ? { cookie } : {} }));
}

const cookiesOf = (res: Response) => res.headers.getSetCookie();
const cookieValue = (res: Response, name: string) =>
  cookiesOf(res).find((c) => c.startsWith(`${name}=`))?.split(';')[0].slice(name.length + 1);

describe('GET /auth/github', () => {
  it('GitHub 인증 페이지로 보내고 state를 httpOnly 쿠키에 저장한다', async () => {
    const res = await get(start.GET, '/auth/github?next=/todos');
    expect([302, 307]).toContain(res.status);
    const location = new URL(res.headers.get('location')!);
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('client_id')).toBe('test-client-id');
    expect(location.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/github/callback');
    expect(location.searchParams.get('scope')).toBe('read:user');
    const state = location.searchParams.get('state');
    expect(state && state.length >= 16).toBe(true);
    expect(cookieValue(res, 'oauth_state')).toBe(state);
    expect(cookiesOf(res).find((c) => c.startsWith('oauth_state='))).toMatch(/HttpOnly/i);
    expect(cookieValue(res, 'oauth_next')).toBe('%2Ftodos');
    expect(location.toString()).not.toContain('test-client-secret');
  });

  it('APP_URL이 있으면 콜백 주소에 사용한다', async () => {
    process.env.APP_URL = 'https://todo.example.com/';
    const res = await get(start.GET, '/auth/github');
    expect(new URL(res.headers.get('location')!).searchParams.get('redirect_uri')).toBe('https://todo.example.com/auth/github/callback');
  });

  it('환경 변수가 없으면 /login?error=config', async () => {
    delete process.env.GITHUB_CLIENT_SECRET;
    const res = await get(start.GET, '/auth/github');
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=config');
  });
});

describe('GET /auth/github/callback', () => {
  it('성공: 사용자 저장 + 세션 생성 + 세션 쿠키 + 원래 경로로 이동', async () => {
    mockGithub({ id: 42, login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/42' });
    const res = await get(callback.GET, '/auth/github/callback?code=the-code&state=s1', 'oauth_state=s1; oauth_next=%2Ftodos');
    expect(res.headers.get('location')).toBe('http://localhost:3000/todos');

    const sid = cookieValue(res, 'sid');
    expect(sid && sid.length >= 32).toBe(true);
    const sidCookie = cookiesOf(res).find((c) => c.startsWith('sid='))!;
    expect(sidCookie).toMatch(/HttpOnly/i);
    expect(sidCookie).toMatch(/SameSite=lax/i);
    expect(sidCookie).toMatch(/Path=\//i);

    const user = await User.findOne({ githubId: 42 }).lean();
    expect(user).toMatchObject({ username: 'octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/42' });
    const session = await Session.findOne({ userId: user!._id }).lean();
    expect(session).toBeTruthy();
    expect(session!.tokenHash).not.toBe(sid); // DB에는 토큰 원문이 아니라 해시만

    const meRes = await callHandler(me.GET, { cookie: `sid=${sid}` });
    expect(meRes.body).toEqual({ username: 'octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/42' });
  });

  it('다시 로그인하면 같은 사용자의 이름/아바타를 갱신한다 (중복 생성 없음)', async () => {
    mockGithub({ id: 42, login: 'octocat', avatar_url: 'a1' });
    await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    mockGithub({ id: 42, login: 'octo-renamed', avatar_url: 'a2' });
    await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    const users = await User.find().lean();
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ username: 'octo-renamed', avatarUrl: 'a2' });
  });

  it.each([
    ['state 불일치', '/auth/github/callback?code=the-code&state=evil', 'oauth_state=s1', 'state'],
    ['state 쿠키 없음', '/auth/github/callback?code=the-code&state=s1', undefined, 'state'],
    ['code 없음', '/auth/github/callback?state=s1', 'oauth_state=s1', 'state'],
    ['사용자가 GitHub에서 취소', '/auth/github/callback?error=access_denied&state=s1', 'oauth_state=s1', 'denied'],
  ])('%s → /login?error=%s, 세션 없음, GitHub 호출 없음', async (_n, url, cookie, error) => {
    const fetch = mockGithub({ id: 1, login: 'x', avatar_url: '' });
    const res = await get(callback.GET, url, cookie);
    expect(res.headers.get('location')).toBe(`http://localhost:3000/login?error=${error}`);
    expect(cookieValue(res, 'sid')).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(await Session.countDocuments()).toBe(0);
  });

  it('토큰 교환 실패 → error=github, 사용자/세션 없음', async () => {
    mockGithub({ id: 1, login: 'x', avatar_url: '' }, false);
    const res = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=github');
    expect(await User.countDocuments()).toBe(0);
    expect(await Session.countDocuments()).toBe(0);
  });

  it('GitHub 사용자 조회 실패 → error=github', async () => {
    mockGithub(null);
    const res = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=github');
    expect(await Session.countDocuments()).toBe(0);
  });

  it('외부 주소로 돌려보내지 않는다', () => {
    for (const evil of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/\r\n/evil.com',
      '/%09/evil.com/..', // 인코딩된 값은 경로로 남아 같은 사이트
      '/\u0000/evil.com',
      'evil.com',
      '/..//evil.com',
      '/.//evil.com',
      '/a/..//evil.com',
      '/%2e%2e//evil.com',
      '/%2e//evil.com',
      '/a/b/../..//evil.com',
    ]) {
      const result = safeNextPath(evil);
      expect(new URL(result, 'http://localhost:3000').origin, JSON.stringify(evil)).toBe('http://localhost:3000');
      expect(result.startsWith('//'), JSON.stringify(evil)).toBe(false);
      // 한 번 정리한 값은 다시 정리해도 같아야 한다 (호출부가 한 번만 걸러도 안전)
      expect(safeNextPath(result), JSON.stringify(evil)).toBe(result);
    }
    expect(safeNextPath('/login')).toBe('/');
    expect(safeNextPath('/auth/github')).toBe('/');
    expect(safeNextPath('/weekly/abc?x=1#y')).toBe('/weekly/abc?x=1#y');
  });

  it.each([
    '%2F%09%2Fevil.com',
    '%2F%0A%2Fevil.com',
    '%2F%0D%0A%2Fevil.com',
    '%2F%5Cevil.com',
    '%2F%2Fevil.com',
    '%2F..%2F%2Fevil.com',
    '%2F%252e%252e%2F%2Fevil.com',
    '%2Fa%2F..%2F%2Fevil.com',
  ])(
    'next=%s: 쿠키에도 안전한 값만 저장되고 콜백도 같은 사이트로 보낸다',
    async (encoded) => {
      const startRes = await get(start.GET, `/auth/github?next=${encoded}`);
      expect(cookieValue(startRes, 'oauth_next')).toBe('%2F');

      // 공격자가 쿠키를 직접 심었다고 가정해도 콜백이 막아야 한다
      mockGithub({ id: 5, login: 'v', avatar_url: '' });
      const res = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', `oauth_state=s; oauth_next=${encoded}`);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    },
  );

  it('다시 로그인하면 이 브라우저의 이전 세션은 지운다', async () => {
    mockGithub({ id: 8, login: 'w', avatar_url: '' });
    const first = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    const oldSid = cookieValue(first, 'sid')!;
    const second = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', `oauth_state=s; sid=${oldSid}`);
    expect(cookieValue(second, 'sid')).not.toBe(oldSid);
    expect(await Session.countDocuments()).toBe(1);
    expect((await callHandler(todos.GET, { cookie: `sid=${oldSid}` })).status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('세션 문서를 삭제하고 쿠키를 만료시킨다. 이후 같은 토큰은 401', async () => {
    mockGithub({ id: 7, login: 'u', avatar_url: '' });
    const login = await get(callback.GET, '/auth/github/callback?code=the-code&state=s', 'oauth_state=s');
    const sid = cookieValue(login, 'sid')!;
    expect((await callHandler(todos.GET, { cookie: `sid=${sid}` })).status).toBe(200);
    expect(await Session.countDocuments()).toBe(1);

    const res = await logout.POST(new Request('http://localhost:3000/auth/logout', { method: 'POST', headers: { cookie: `sid=${sid}` } }));
    expect(res.status).toBe(200);
    const cleared = cookiesOf(res).find((c) => c.startsWith('sid='))!;
    expect(cleared).toMatch(/^sid=;/);
    expect(cleared).toMatch(/Max-Age=0/i);
    expect(await Session.countDocuments()).toBe(0);

    expect((await callHandler(todos.GET, { cookie: `sid=${sid}` })).status).toBe(401);
    expect((await callHandler(me.GET, { cookie: `sid=${sid}` })).status).toBe(401);
  });

  it('쿠키 없이 호출해도 200 (이미 로그아웃된 상태)', async () => {
    const res = await logout.POST(new Request('http://localhost:3000/auth/logout', { method: 'POST' }));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/me', () => {
  it('로그인하지 않으면 401', async () => {
    expect((await callHandler(me.GET)).status).toBe(401);
  });
});
