import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  callbackUrl,
  exchangeCodeForToken,
  fetchGithubUser,
  githubConfig,
  safeNextPath,
} from '@/lib/github';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSession, deleteSession, readCookie, sessionCookieOptions } from '@/lib/session';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

function sameState(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** 로그인 실패: 임시 쿠키를 지우고 로그인 화면으로 */
function fail(req: Request, error: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_NEXT_COOKIE);
  return res;
}

/** GitHub가 돌려보낸 code로 사용자 정보를 받아 저장하고 세션을 만듭니다. */
export async function GET(req: Request) {
  if (!githubConfig()) return fail(req, 'config');
  const params = new URL(req.url).searchParams;
  if (params.get('error')) return fail(req, 'denied'); // 사용자가 GitHub에서 취소

  const code = params.get('code');
  const state = params.get('state');
  const savedState = readCookie(req, OAUTH_STATE_COOKIE);
  if (!code || !state || !savedState || !sameState(state, savedState)) return fail(req, 'state');

  let githubUser;
  try {
    const accessToken = await exchangeCodeForToken(code, callbackUrl(req));
    githubUser = await fetchGithubUser(accessToken);
  } catch (err) {
    console.error(err);
    return fail(req, 'github');
  }

  try {
    await connectDB();
    // 같은 GitHub 계정이면 같은 사용자. 이름과 아바타는 로그인할 때마다 최신으로 갱신합니다.
    const user = await User.findOneAndUpdate(
      { githubId: githubUser.id },
      { $set: { username: githubUser.login, avatarUrl: githubUser.avatar_url } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    // 이 브라우저에 남아 있던 이전 세션은 지우고 새 세션으로 바꿉니다.
    const previous = readCookie(req, SESSION_COOKIE);
    if (previous) await deleteSession(previous);
    const token = await createSession(String(user._id));

    const res = NextResponse.redirect(new URL(safeNextPath(readCookie(req, OAUTH_NEXT_COOKIE)), req.url));
    res.cookies.set(SESSION_COOKIE, token, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.delete(OAUTH_NEXT_COOKIE);
    return res;
  } catch (err) {
    console.error(err);
    return fail(req, 'server');
  }
}
