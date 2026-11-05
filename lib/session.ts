import { createHash, randomBytes } from 'node:crypto';
import { Session } from '@/models/Session';

export const SESSION_COOKIE = 'sid';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Cookie 헤더에서 이름으로 값을 꺼냅니다. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      const value = part.slice(i + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

/** 새 세션을 만들고 쿠키에 넣을 토큰을 돌려줍니다. */
export async function createSession(userId: string): Promise<string> {
  const token = randomToken();
  await Session.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  });
  return token;
}

/** 요청의 세션 쿠키가 유효하면 사용자 id, 아니면 null */
export async function getSessionUserId(req: Request): Promise<string | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
    .select('userId')
    .lean();
  return session ? String(session.userId) : null;
}

/** 세션 문서를 삭제합니다. */
export async function deleteSession(token: string): Promise<void> {
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
