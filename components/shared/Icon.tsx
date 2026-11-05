/** 미니멀 선 아이콘 (24×24, stroke). 의존성 없이 필요한 것만 둡니다. */
const PATHS = {
  home: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  board: ['M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z'],
  calendar: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M16 3v4M8 3v4M3 10h18'],
  target: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9z', 'M12 11.5a.5.5 0 1 0 0 1 .5.5 0 1 0 0-1z'],
  plus: ['M12 5v14M5 12h14'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z', 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'],
  moon: ['M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z'],
  monitor: ['M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 21h8M12 17v4'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'],
  x: ['M18 6 6 18M6 6l12 12'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M12 7v5l3 2'],
  check: ['M20 6 9 17l-5-5'],
  circle: ['M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16z'],
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
