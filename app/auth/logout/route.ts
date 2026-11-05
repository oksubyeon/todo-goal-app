import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SESSION_COOKIE, deleteSession, readCookie, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** 로그아웃: DB의 세션 문서를 지우고 쿠키도 만료시킵니다. */
export async function POST(req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    try {
      await connectDB();
      await deleteSession(token);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: '로그아웃하지 못했습니다. 다시 시도하세요.' }, { status: 500 });
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
