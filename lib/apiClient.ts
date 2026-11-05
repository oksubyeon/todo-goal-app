/** 세션이 만료됐을 때: 남은 쿠키를 지우고 로그인 화면으로 보냅니다. */
let redirecting = false;
function goToLogin() {
  if (redirecting || typeof window === 'undefined') return;
  redirecting = true;
  const next = window.location.pathname + window.location.search;
  const target = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;
  fetch('/auth/logout', { method: 'POST' }).finally(() => window.location.assign(target));
}

/** 브라우저용 fetch 래퍼. 실패하면 서버의 error 메시지로 Error를 던집니다. */
export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) goToLogin();
    const err = new Error((data as { error?: string }).error ?? `요청 실패 (${res.status})`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}
