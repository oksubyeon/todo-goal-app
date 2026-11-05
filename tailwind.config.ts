import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';
import defaultTheme from 'tailwindcss/defaultTheme';

/** CSS 변수(app/globals.css)를 Tailwind 색으로 씁니다. 다크 모드에서는 변수 값만 바뀝니다. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // <html class="dark">로 전환 (기본값은 시스템 설정, 헤더에서 바꿀 수 있음)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 메인 컬러: 인디고 (#4F46E5 = brand-600)
        brand: colors.indigo,
        canvas: token('canvas'), // 페이지 배경
        surface: token('surface'), // 카드·모달·입력창
        subtle: token('subtle'), // 은은한 배경 (칸반 컬럼, hover)
        line: token('line'), // 테두리·구분선
        fg: token('fg'), // 본문 글자
        muted: token('muted'), // 보조 글자
        faint: token('faint'), // 흐린 글자·placeholder
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        // 은은한 그림자
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lift: '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
