import { NextResponse, type NextRequest } from 'next/server';

/**
 * 세션 쿠키가 없으면 화면 요청을 /login으로 보냅니다.
 * (Edge에서 실행되므로 쿠키 존재만 확인합니다. 세션의 실제 유효성은 API가 검사하고,
 *  만료된 쿠키로 API가 401을 받으면 화면이 /login으로 이동합니다.)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // 로그인 화면 자체는 그대로 보여 줍니다 (/login, /login/...만. /loginx 같은 다른 경로는 보호).
  if (pathname === '/login' || pathname.startsWith('/login/')) return NextResponse.next();
  if (req.cookies.get('sid')?.value) return NextResponse.next();
  const login = new URL('/login', req.url);
  if (pathname + search !== '/') login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // API(/api: 401로 응답), 로그인 흐름(/auth), 정적 파일은 제외
  matcher: ['/((?!api/|auth/|_next/static|_next/image|favicon.ico).*)'],
};
