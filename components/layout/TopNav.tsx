'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/shared/Icon';
import ThemeToggle from './ThemeToggle';
import AccountMenu from './AccountMenu';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: '대시보드', icon: 'home' },
  { href: '/todos', label: '할 일', icon: 'board' },
  { href: '/weekly', label: '주간 계획', icon: 'calendar' },
  { href: '/goals', label: '1년 목표', icon: 'target' },
];

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-brand-500" aria-label="할일 + 계획 홈">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
        <Icon name="check" className="h-5 w-5" />
      </span>
      <span className="hidden text-xl font-bold tracking-tight lg:inline">할일 + 계획</span>
    </Link>
  );
}

/**
 * 상단 내비게이션: 로고(왼쪽) · 탭(가운데, 활성 탭은 2px 잉크 밑줄) · 테마와 계정 메뉴(오른쪽).
 * 768px 미만에서는 탭이 햄버거 메뉴 안으로 들어갑니다.
 */
export default function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]); // 이동하면 모바일 메뉴 닫기

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6 md:grid md:h-20 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <div className="flex items-center gap-2">
          <button
            className="icon-btn md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
          <Logo />
        </div>

        <nav className="hidden h-full items-stretch gap-2 md:flex" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3 text-base font-semibold transition after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full ${
                  active ? 'text-fg after:bg-fg' : 'text-muted after:bg-transparent hover:text-fg hover:after:bg-line'
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-canvas px-4 py-2 md:hidden" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold ${active ? 'bg-subtle text-fg' : 'text-muted'}`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
