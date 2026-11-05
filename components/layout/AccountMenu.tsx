'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/apiClient';
import Icon from '@/components/shared/Icon';

type Me = { username: string; avatarUrl: string };

/** 오른쪽 계정 메뉴: 알약 모양 버튼(메뉴 아이콘 + 아바타) → 드롭다운(사용자 이름, 로그아웃) */
export default function AccountMenu() {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Me>('/api/me').then(setMe, () => {}); // 401이면 api()가 로그인 화면으로 보냅니다.
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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

  return (
    <div className="relative" ref={ref} data-testid="user-menu">
      <button
        className="flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface pl-3 pr-1.5 transition hover:shadow-float"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴"
      >
        {/* 모바일에는 왼쪽 햄버거가 있으므로 데스크톱에서만 */}
        <span className="hidden md:inline-flex">
          <Icon name="menu" className="h-4 w-4" />
        </span>
        {me?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="h-7 w-7 rounded-full bg-strong" />
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-card bg-surface py-2 shadow-float">
          <div className="border-b border-line-soft px-4 pb-3 pt-1">
            <div className="text-xs text-muted">GitHub 계정</div>
            <div className="truncate text-sm font-semibold text-fg" data-testid="username">
              {me?.username ?? '…'}
            </div>
          </div>
          <button
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-fg transition hover:bg-subtle disabled:text-faint"
            onClick={logout}
            disabled={leaving}
          >
            <Icon name="logout" className="h-4 w-4" />
            {leaving ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  );
}
