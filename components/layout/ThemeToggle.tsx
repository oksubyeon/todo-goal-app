'use client';

import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/shared/Icon';

type Theme = 'light' | 'dark' | 'system';
const ORDER: Theme[] = ['system', 'light', 'dark'];
const LABEL: Record<Theme, string> = { system: '시스템 설정', light: '라이트 모드', dark: '다크 모드' };
const ICON: Record<Theme, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

export const THEME_KEY = 'theme';

/** <head>에서 페인트 전에 실행돼 깜빡임 없이 테마를 적용합니다 (app/layout.tsx). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

/** 시스템 → 라이트 → 다크 순서로 바뀝니다. 선택은 이 브라우저에 저장됩니다. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => setTheme(readTheme()), []);

  useEffect(() => {
    if (theme !== 'system') return;
    // 시스템 설정을 따를 때는 OS에서 바꾸면 바로 반영합니다.
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const next = () => {
    const t = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(t);
    try {
      if (t === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, t);
    } catch {
      /* 저장할 수 없어도 이번 화면에는 적용 */
    }
    apply(t);
  };

  return (
    <button className="icon-btn" onClick={next} title={`테마: ${LABEL[theme]}`} aria-label={`테마 바꾸기 (현재: ${LABEL[theme]})`} data-testid="theme-toggle">
      <Icon name={ICON[theme]} />
    </button>
  );
}
