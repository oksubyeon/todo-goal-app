'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '대시보드', icon: '🏠' },
  { href: '/todos', label: '할 일', icon: '✅' },
  { href: '/weekly', label: '주간 계획', icon: '🗓️' },
  { href: '/goals', label: '1년 목표', icon: '🎯' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-slate-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="hidden px-5 py-5 text-lg font-bold text-indigo-600 md:block">할일 + 계획</div>
      <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
