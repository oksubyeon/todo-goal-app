/** GitHub OAuth 설정과 API 호출. 비밀값은 환경 변수에서만 읽습니다. */

export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_NEXT_COOKIE = 'oauth_next';

export function githubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** 콜백 주소. APP_URL이 있으면 그것을, 없으면 요청이 들어온 주소를 기준으로 합니다. */
export function callbackUrl(req: Request): string {
  const base = process.env.APP_URL?.replace(/\/+$/, '') || new URL(req.url).origin;
  return `${base}/auth/github/callback`;
}

/**
 * 로그인 후 돌아갈 경로. 외부 주소로 보내지 않도록 같은 사이트의 절대 경로만 허용합니다.
 * 문자열 모양이 아니라 브라우저가 실제로 해석한 결과로 판단합니다. URL 파서는 탭·줄바꿈을 지우고
 * 역슬래시를 슬래시로 바꾸므로 "/\t/evil.com"도 "//evil.com"이 될 수 있기 때문입니다.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(value)) return '/';
  const base = 'http://same-origin.invalid';
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return '/';
  }
  if (url.origin !== base) return '/';
  // "/..//evil.com"처럼 점 경로를 정리한 결과가 "//evil.com"(다른 호스트)이 될 수 있으므로 정리 후 다시 확인합니다.
  if (url.pathname.startsWith('//')) return '/';
  if (url.pathname === '/login' || url.pathname.startsWith('/login/') || url.pathname.startsWith('/auth/')) return '/';
  return url.pathname + url.search + url.hash;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const config = githubConfig();
  if (!config) throw new Error('GitHub OAuth 설정이 없습니다.');
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(`토큰 교환 실패: ${data.error ?? res.status}`);
  return data.access_token;
}

interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export async function fetchGithubUser(accessToken: string): Promise<GithubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'todo-goal-app',
    },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as Partial<GithubUser>;
  if (!res.ok || typeof data.id !== 'number' || typeof data.login !== 'string') {
    throw new Error(`GitHub 사용자 조회 실패: ${res.status}`);
  }
  return { id: data.id, login: data.login, avatar_url: data.avatar_url ?? '' };
}
