'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { getWeekStart, toDateKey } from '@/lib/utils';
import Icon from '@/components/shared/Icon';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function Header() {
  const notice = useStore((s) => s.notice);
  const setNotice = useStore((s) => s.setNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="truncate whitespace-nowrap text-sm text-muted" suppressHydrationWarning>
          이번 주{' '}
          <span className="font-medium tabular-nums text-fg">
            {/* 모바일에서는 연도를 빼서 한 줄에 맞춥니다 */}
            <span className="hidden sm:inline">{toDateKey(weekStart).slice(0, 5)}</span>
            {toDateKey(weekStart).slice(5)} ~ <span className="hidden sm:inline">{toDateKey(weekEnd).slice(0, 5)}</span>
            {toDateKey(weekEnd).slice(5)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
      {notice && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg shadow-lift"
        >
          <span className="flex-1">{notice}</span>
          <button className="text-faint hover:text-fg" onClick={() => setNotice(null)} aria-label="닫기">
            <Icon name="x" />
          </button>
        </div>
      )}
    </header>
  );
}
