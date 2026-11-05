import { HttpError, optRef } from '@/lib/api';
import { Goal } from '@/models/Goal';

/** goalId 입력 검증 + 실제로 있는 목표인지 확인. undefined = 변경 없음 */
export async function parseGoalRef(body: Record<string, unknown>): Promise<string | null | undefined> {
  const goalId = optRef(body, 'goalId');
  if (goalId && !(await Goal.exists({ _id: goalId }))) throw new HttpError(400, '존재하지 않는 목표입니다.');
  return goalId;
}
import { parseDateKey } from '@/lib/utils';
import { MAX_WEEKLY_GOALS } from '@/types';

/** 'YYYY-MM-DD'를 받아 그 주 월요일의 UTC 자정 Date로 정규화합니다. */
export function normalizeWeekStart(value: unknown): Date {
  const date = typeof value === 'string' ? parseDateKey(value.slice(0, 10)) : null;
  if (!date) throw new HttpError(400, 'weekStart는 YYYY-MM-DD 형식이어야 합니다.');
  const diff = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date;
}

/** 주간 목표 입력: 문자열 또는 {text, done} 배열 */
export function parseWeeklyGoals(value: unknown): { text: string; done: boolean }[] {
  if (!Array.isArray(value)) throw new HttpError(400, 'goals는 배열이어야 합니다.');
  const goals = value
    .map((g) => {
      if (typeof g === 'string') return { text: g.trim(), done: false };
      if (g && typeof g === 'object' && typeof (g as { text?: unknown }).text === 'string') {
        return { text: (g as { text: string }).text.trim(), done: Boolean((g as { done?: unknown }).done) };
      }
      throw new HttpError(400, '주간 목표 형식이 올바르지 않습니다.');
    })
    .filter((g) => g.text.length > 0);
  if (goals.length > MAX_WEEKLY_GOALS) {
    throw new HttpError(400, `주간 목표는 최대 ${MAX_WEEKLY_GOALS}개까지 만들 수 있습니다.`);
  }
  return goals;
}
