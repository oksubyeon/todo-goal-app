'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import Icon from '@/components/shared/Icon';

/** 화면 하단 알림 (저장 실패·롤백 등). 5초 뒤 자동으로 닫힙니다. */
export default function Toast() {
  const notice = useStore((s) => s.notice);
  const setNotice = useStore((s) => s.setNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-lg bg-fg px-4 py-3 text-sm text-canvas shadow-float"
    >
      <span className="flex-1">{notice}</span>
      <button className="opacity-70 transition hover:opacity-100" onClick={() => setNotice(null)} aria-label="닫기">
        <Icon name="x" />
      </button>
    </div>
  );
}
