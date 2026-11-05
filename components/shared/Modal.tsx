'use client';

import { useEffect } from 'react';
import Icon from './Icon';

/** 모달: 50% 검은 배경 위, 14px 모서리 + 그림자 한 단계. 닫기는 왼쪽, 제목은 가운데. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-card bg-surface shadow-float sm:max-w-xl sm:rounded-card"
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-line px-6">
          <button onClick={onClose} className="icon-btn absolute left-4" aria-label="닫기">
            <Icon name="x" />
          </button>
          <h2 className="text-base font-bold text-fg">{title}</h2>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
