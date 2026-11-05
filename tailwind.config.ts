import type { Config } from 'tailwindcss';
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
        // 단일 강조색: 코랄 (#ff385c = brand-500, 눌림 #e00b41 = brand-600, 비활성 #ffd1da = brand-200)
        brand: {
          50: '#fff1f3',
          100: '#ffe4e9',
          200: '#ffd1da',
          300: '#ffa3b6',
          400: '#ff6b87',
          500: '#ff385c',
          600: '#e00b41',
          700: '#bd0a37',
          800: '#9b0b31',
          900: '#800d2d',
          950: '#470214',
        },
        canvas: token('canvas'), // 페이지 바닥
        surface: token('surface'), // 카드·모달·입력
        subtle: token('subtle'), // 가장 옅은 채움 (칸반 컬럼, hover)
        strong: token('strong'), // 조금 더 진한 채움 (원형 아이콘 버튼)
        line: token('line'), // 기본 1px 테두리
        'line-soft': token('line-soft'), // 옅은 구분선
        fg: token('fg'), // 잉크: 제목·본문
        muted: token('muted'), // 보조 글자
        faint: token('faint'), // 비활성·흐린 글자
        danger: token('danger'), // 오류 글자
      },
      fontFamily: {
        // Pretendard = Inter 기반 + 한글. 문서가 권하는 Inter 대체와 같은 비율입니다.
        sans: ['"Pretendard Variable"', 'Pretendard', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        card: '14px', // 카드·모달
      },
      boxShadow: {
        // 그림자는 이 한 단계뿐: hover로 뜬 카드, 드롭다운, 모달
        float: '0 0 0 1px rgb(0 0 0 / 0.02), 0 2px 6px 0 rgb(0 0 0 / 0.04), 0 4px 8px 0 rgb(0 0 0 / 0.1)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};
export default config;
