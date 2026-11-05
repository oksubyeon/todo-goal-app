'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { WEEK_DAYS, dateKeyFromStored } from '@/lib/utils';
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Priority, type Todo, type TodoStatus } from '@/types';
import type { TodoInput } from '@/store/todoSlice';

export type TodoFormValues = Required<Pick<TodoInput, 'title'>> & TodoInput;

export default function TodoForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial: Partial<Todo>;
  submitLabel: string;
  onSubmit: (values: TodoFormValues) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const plans = useStore((s) => s.plans);
  const goals = useStore((s) => s.goals);

  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [status, setStatus] = useState<TodoStatus>(initial.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(initial.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initial.dueDate ? dateKeyFromStored(initial.dueDate) : '');
  const [weeklyPlanId, setWeeklyPlanId] = useState(initial.weeklyPlanId ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(initial.dayOfWeek == null ? '' : String(initial.dayOfWeek));
  const [goalId, setGoalId] = useState(initial.goalId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const changePlan = (id: string) => {
    setWeeklyPlanId(id);
    // 주간 계획에 1년 목표가 연결돼 있으면 기본값으로 이어 줍니다 (할 일 → 주간 계획 → 1년 목표).
    const plan = plans.find((p) => p._id === id);
    if (!goalId && plan?.goalId) setGoalId(plan.goalId);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        status,
        priority,
        dueDate: dueDate || null,
        weeklyPlanId: weeklyPlanId || null,
        dayOfWeek: dayOfWeek === '' ? null : Number(dayOfWeek),
        goalId: goalId || null,
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!onDelete || !confirm('이 할 일을 삭제할까요?')) return;
    setSaving(true);
    try {
      await onDelete();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="todo-title">제목 *</label>
        <input id="todo-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus maxLength={200} />
      </div>
      <div>
        <label className="label" htmlFor="todo-desc">설명</label>
        <textarea id="todo-desc" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="todo-status">상태</label>
          <select id="todo-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as TodoStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="todo-priority">우선순위</label>
          <select id="todo-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="todo-due">마감일</label>
          <input id="todo-due" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="todo-day">요일</label>
          <select id="todo-day" className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            <option value="">지정 안 함</option>
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}요일</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="todo-plan">주간 계획</label>
        <select id="todo-plan" className="input" value={weeklyPlanId} onChange={(e) => changePlan(e.target.value)}>
          <option value="">연결 안 함</option>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>{dateKeyFromStored(p.weekStart)} 주</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="todo-goal">1년 목표</label>
        <select id="todo-goal" className="input" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">연결 안 함</option>
          {goals.map((g) => (
            <option key={g._id} value={g._id}>{g.title}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        {onDelete ? (
          <button type="button" className="btn-danger" onClick={remove} disabled={saving}>삭제</button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>취소</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? '저장 중…' : submitLabel}</button>
        </div>
      </div>
    </form>
  );
}
