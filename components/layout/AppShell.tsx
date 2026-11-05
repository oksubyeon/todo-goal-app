'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import Toast from './Toast';

/** 로그인 화면에서는 내비게이션을 숨깁니다. 본문은 최대 1280px, 같은 좌우 여백으로 정렬합니다. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-content flex-1 px-6 py-8 md:px-10 md:py-12">{children}</main>
      <Toast />
    </div>
  );
}
