/** 요일 표시 순서(월~일). 저장값은 JS getDay() 규칙: 0=일 … 6=토. */
export const WEEK_DAYS: { value: number; label: string }[] = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

export function dayLabel(day: number): string {
  return WEEK_DAYS.find((d) => d.value === day)?.label ?? '';
}

/** date가 속한 주의 월요일 00:00(로컬 시간)을 반환합니다. */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7; // 월=0 … 일=6
  d.setDate(d.getDate() - diff);
  return d;
}

/** 로컬 날짜를 'YYYY-MM-DD'로 바꿉니다. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 이번 주(또는 date가 속한 주) 월요일의 'YYYY-MM-DD'. */
export function weekKey(date: Date = new Date()): string {
  return toDateKey(getWeekStart(date));
}

/** 'YYYY-MM-DD'를 UTC 자정 Date로 바꿉니다. DB에는 이 값으로 저장해 타임존 차이를 없앱니다. */
export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** DB에 저장된 UTC 자정 Date(또는 ISO 문자열)를 'YYYY-MM-DD'로 바꿉니다. */
export function dateKeyFromStored(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD'에 days일을 더합니다. */
export function addDaysToKey(key: string, days: number): string {
  const d = parseDateKey(key);
  if (!d) return key;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 마감일이 오늘보다 이전이고 아직 끝나지 않은 할 일인지. */
export function isOverdue(dueDate: string | Date | null | undefined, status: string, today: Date = new Date()): boolean {
  if (!dueDate || status === 'done') return false;
  return dateKeyFromStored(dueDate) < toDateKey(today);
}

export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
