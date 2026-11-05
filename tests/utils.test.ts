import { describe, expect, it } from 'vitest';
import { getWeekStart, toDateKey, weekKey, parseDateKey, dateKeyFromStored, isOverdue, percent, addDaysToKey } from '@/lib/utils';
import { keyBetween, keysAfter } from '@/lib/fractionalIndex';

describe('getWeekStart', () => {
  it('일요일 23:59는 그 주 월요일(6일 전)', () => {
    const d = getWeekStart(new Date(2026, 10, 8, 23, 59)); // 2026-11-08 일요일
    expect(toDateKey(d)).toBe('2026-11-02');
    expect(d.getHours()).toBe(0);
  });
  it('월요일 00:00은 그날 자신', () => {
    expect(toDateKey(getWeekStart(new Date(2026, 10, 9, 0, 0)))).toBe('2026-11-09');
  });
  it('수요일은 같은 주 월요일', () => {
    expect(weekKey(new Date(2026, 10, 4, 12))).toBe('2026-11-02');
  });
});

describe('date keys', () => {
  it('parseDateKey는 UTC 자정으로 저장하고 다시 같은 키로 돌아온다', () => {
    const d = parseDateKey('2026-11-02')!;
    expect(d.toISOString()).toBe('2026-11-02T00:00:00.000Z');
    expect(dateKeyFromStored(d)).toBe('2026-11-02');
  });
  it('잘못된 키는 null', () => {
    expect(parseDateKey('2026/11/02')).toBeNull();
  });
  it('addDaysToKey', () => {
    expect(addDaysToKey('2026-11-02', 6)).toBe('2026-11-08');
    expect(addDaysToKey('2026-11-02', -7)).toBe('2026-10-26');
  });
});

describe('isOverdue / percent', () => {
  const today = new Date(2026, 10, 5);
  it('어제 마감인 미완료 할 일은 지남', () => {
    expect(isOverdue('2026-11-04T00:00:00.000Z', 'todo', today)).toBe(true);
  });
  it('완료했거나 오늘 마감이면 아님', () => {
    expect(isOverdue('2026-11-04T00:00:00.000Z', 'done', today)).toBe(false);
    expect(isOverdue('2026-11-05T00:00:00.000Z', 'doing', today)).toBe(false);
    expect(isOverdue(undefined, 'todo', today)).toBe(false);
  });
  it('percent', () => {
    expect(percent(0, 0)).toBe(0);
    expect(percent(2, 4)).toBe(50);
    expect(percent(1, 3)).toBe(33);
  });
});

describe('fractional index', () => {
  it('keyBetween(a,b)는 a와 b 사이에 정렬된다', () => {
    const a = keyBetween(null, null);
    const c = keyBetween(a, null);
    const b = keyBetween(a, c);
    expect(a < b && b < c).toBe(true);
    const first = keyBetween(null, a);
    expect(first < a).toBe(true);
  });
  it('keysAfter는 정렬된 n개의 키를 만든다', () => {
    const keys = keysAfter(null, 5);
    expect(keys).toHaveLength(5);
    expect([...keys].sort()).toEqual(keys);
  });
});
