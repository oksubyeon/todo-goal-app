import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { themeInitScript } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = {
  title: '할일 + 계획',
  description: '할 일, 주간 계획, 1년 목표를 하나로 연결하는 개인 계획 앱',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 테마 클래스는 페인트 전에 스크립트가 붙이므로 hydration 경고를 끕니다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
