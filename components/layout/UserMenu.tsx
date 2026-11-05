'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import Icon from '@/components/shared/Icon';

type Me = { username: string; avatarUrl: string };

/** 헤더의 GitHub 사용자 표시 + 로그아웃 */
export default function UserMenu() {
  const [me, setMe] = useState<Me | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    api<Me>('/api/me').then(setMe, () => {}); // 401이면 api()가 로그인 화면으로 보냅니다.
  }, []);

  const logout = async () => {
    setLeaving(true);
    try {
      const res = await fetch('/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error();
      // 전체 페이지 이동으로 화면에 남은 데이터(스토어)도 비웁니다.
      window.location.assign('/login');
    } catch {
      setLeaving(false);
      alert('로그아웃하지 못했습니다. 다시 시도하세요.');
    }
  };

  if (!me) return <div className="h-8 w-8" />;
  return (
    <div className="flex items-center gap-2 border-l border-line pl-3" data-testid="user-menu">
      {me.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={me.avatarUrl} alt="" className="h-8 w-8 rounded-full ring-1 ring-line" />
      )}
      <span className="hidden text-sm font-medium text-fg sm:inline" data-testid="username">
        {me.username}
      </span>
      <button className="btn-ghost btn-sm whitespace-nowrap" onClick={logout} disabled={leaving} aria-label="로그아웃">
        <Icon name="logout" className="h-3.5 w-3.5" />
        {/* 모바일에서는 아이콘만 */}
        <span className="hidden sm:inline">{leaving ? '로그아웃 중…' : '로그아웃'}</span>
      </button>
    </div>
  );
}
