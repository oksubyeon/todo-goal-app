'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { weekKey } from '@/lib/utils';
import { MAX_WEEKLY_GOALS, type WeeklyPlan } from '@/types';
import type { WeeklyPlanInput } from '@/store/weeklySlice';

/** plan이 없으면 새 주간 계획 만들기, 있으면 주간 목표/메모/1년 목표 수정 */
export default function WeeklyPlanForm({
  plan,
  defaultWeekStart,
  onSubmit,
  onCancel,
}: {
  plan?: WeeklyPlan;
  defaultWeekStart?: string;
  onSubmit: (values: WeeklyPlanInput) => Promise<void>;
  onCancel: () => void;
}) {
  const goals = useStore((s) => s.goals);
  const [weekStart, setWeekStart] = useState(defaultWeekStart ?? weekKey());
  const [items, setItems] = useState<{ text: string; done: boolean }[]>(
    plan?.goals.length ? plan.goals.map((g) => ({ text: g.text, done: g.done })) : [{ text: '', done: false }],
  );
  const [memo, setMemo] = useState(plan?.memo ?? '');
  const [goalId, setGoalId] = useState(plan?.goalId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setItem = (i: number, text: string) => setItems(items.map((it, j) => (j === i ? { ...it, text } : it)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = items.map((it) => ({ ...it, text: it.text.trim() })).filter((it) => it.text);
    if (cleaned.length > MAX_WEEKLY_GOALS) {
      setError(`주간 목표는 최대 ${MAX_WEEKLY_GOALS}개까지 만들 수 있습니다.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...(plan ? {} : { weekStart: weekKey(new Date(`${weekStart}T00:00:00`)) }),
        goals: cleaned,
        memo,
        goalId: goalId || null,
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!plan && (
        <div>
          <label className="label" htmlFor="week-start">주 (그 주의 아무 날짜나 고르면 월요일로 맞춰집니다)</label>
          <input id="week-start" type="date" required className="input" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
      )}
      <div>
        <label className="label" htmlFor="week-goal">연결할 1년 목표</label>
        <select id="week-goal" className="input" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">연결 안 함</option>
          {goals.map((g) => (
            <option key={g._id} value={g._id}>{g.title}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="label">
          이번 주 목표 ({items.filter((i) => i.text.trim()).length}/{MAX_WEEKLY_GOALS})
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                value={item.text}
                onChange={(e) => setItem(i, e.target.value)}
                placeholder={`목표 ${i + 1}`}
                aria-label={`주간 목표 ${i + 1}`}
                maxLength={200}
              />
              <button type="button" className="btn-secondary px-2" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="목표 삭제">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-2 text-xs"
          disabled={items.length >= MAX_WEEKLY_GOALS}
          onClick={() => setItems([...items, { text: '', done: false }])}
        >
          ＋ 목표 추가
        </button>
        {items.length >= MAX_WEEKLY_GOALS && <p className="mt-1 text-xs text-slate-500">한 주에 목표는 최대 {MAX_WEEKLY_GOALS}개입니다.</p>}
      </div>
      <div>
        <label className="label" htmlFor="week-memo">메모</label>
        <textarea id="week-memo" className="input" rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? '저장 중…' : plan ? '저장' : '만들기'}</button>
      </div>
    </form>
  );
}
