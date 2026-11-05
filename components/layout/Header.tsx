'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { getWeekStart, toDateKey } from '@/lib/utils';
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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="text-sm text-slate-500" suppressHydrationWarning>
        이번 주 <span className="font-medium text-slate-700">{toDateKey(weekStart)} ~ {toDateKey(weekEnd)}</span>
      </div>
      <UserMenu />
      {notice && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{notice}</span>
          <button className="text-slate-400 hover:text-white" onClick={() => setNotice(null)} aria-label="닫기">
            ✕
          </button>
        </div>
      )}
    </header>
  );
}
