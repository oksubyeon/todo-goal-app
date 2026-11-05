import { NextResponse } from 'next/server';
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, callbackUrl, githubConfig, safeNextPath } from '@/lib/github';
import { randomToken, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GitHub 로그인 시작: state를 쿠키에 저장하고 GitHub 인증 페이지로 보냅니다. */
export async function GET(req: Request) {
  const config = githubConfig();
  if (!config) return NextResponse.redirect(new URL('/login?error=config', req.url));

  const state = randomToken(16);
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', config.clientId);
  authorize.searchParams.set('redirect_uri', callbackUrl(req));
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('allow_signup', 'true');

  const res = NextResponse.redirect(authorize);
  const short = { ...sessionCookieOptions, maxAge: 600 }; // 10분 안에 로그인을 마쳐야 합니다.
  res.cookies.set(OAUTH_STATE_COOKIE, state, short);
  res.cookies.set(OAUTH_NEXT_COOKIE, safeNextPath(new URL(req.url).searchParams.get('next')), short);
  return res;
}
