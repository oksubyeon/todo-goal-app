'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/shared/Icon';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: '대시보드', icon: 'home' },
  { href: '/todos', label: '할 일', icon: 'board' },
  { href: '/weekly', label: '주간 계획', icon: 'calendar' },
  { href: '/goals', label: '1년 목표', icon: 'target' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="hidden h-16 items-center gap-2.5 px-6 md:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-soft">
          <Icon name="check" className="h-4 w-4" />
        </span>
        <span className="text-base font-semibold tracking-tight text-fg">할일 + 계획</span>
      </div>
      <nav className="flex gap-1 px-2 py-2 md:flex-col md:px-3 md:py-3">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition md:flex-none md:justify-start md:gap-2.5 md:px-3 ${
                active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-muted hover:bg-subtle hover:text-fg'
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
