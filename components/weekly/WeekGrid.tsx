'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import { compareTodos } from '@/lib/kanban';
import { WEEK_DAYS, addDaysToKey, dateKeyFromStored, toDateKey } from '@/lib/utils';
import Icon from '@/components/shared/Icon';
import PriorityBadge from '@/components/shared/PriorityBadge';
import type { Todo, WeeklyPlan } from '@/types';

const STATUS_DOT = { todo: 'bg-slate-400', doing: 'bg-amber-400', done: 'bg-emerald-500' } as const;

function MiniTodo({ todo, onOpen }: { todo: Todo; onOpen: (t: Todo) => void }) {
  return (
    <button
      onClick={() => onOpen(todo)}
      className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-left text-xs shadow-soft transition hover:shadow-lift"
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[todo.status]}`} />
        <span className={`truncate ${todo.status === 'done' ? 'text-faint line-through' : 'text-fg'}`}>{todo.title}</span>
      </div>
      {todo.priority === 'high' && (
        <div className="mt-1.5">
          <PriorityBadge priority="high" />
        </div>
      )}
    </button>
  );
}

/** 월~일 7열. 칸의 + 버튼을 누르면 그 요일로 할 일을 만듭니다. */
export default function WeekGrid({
  plan,
  onAdd,
  onOpen,
}: {
  plan: WeeklyPlan;
  onAdd: (dayOfWeek: number | null) => void;
  onOpen: (todo: Todo) => void;
}) {
  const todos = useStore((s) => s.todos);
  const planTodos = useMemo(() => todos.filter((t) => t.weeklyPlanId === plan._id).sort(compareTodos), [todos, plan._id]);
  const start = dateKeyFromStored(plan.weekStart);
  const today = toDateKey(new Date());
  const unscheduled = planTodos.filter((t) => t.dayOfWeek == null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {WEEK_DAYS.map((day, i) => {
          const date = addDaysToKey(start, i);
          const items = planTodos.filter((t) => t.dayOfWeek === day.value);
          const isToday = date === today;
          return (
            <div
              key={day.value}
              data-testid={`day-${day.value}`}
              className={`flex min-h-[140px] flex-col rounded-xl border p-2 ${
                isToday ? 'border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-transparent bg-subtle'
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span
                  className={`text-xs font-semibold ${
                    day.value === 0 ? 'text-red-500 dark:text-red-400' : day.value === 6 ? 'text-sky-600 dark:text-sky-400' : 'text-fg'
                  }`}
                >
                  {day.label} <span className="font-normal tabular-nums text-faint">{date.slice(5)}</span>
                </span>
                <button className="icon-btn h-6 w-6" onClick={() => onAdd(day.value)} aria-label={`${day.label}요일에 할 일 추가`}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {items.map((t) => (
                  <MiniTodo key={t._id} todo={t} onOpen={onOpen} />
                ))}
                {items.length === 0 && (
                  <button
                    className="flex-1 rounded-lg text-xs text-faint transition hover:bg-surface hover:text-brand-600 dark:hover:text-brand-400"
                    onClick={() => onAdd(day.value)}
                  >
                    할 일 배치
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-dashed border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">요일 미지정 ({unscheduled.length})</span>
          <button className="btn-ghost btn-sm" onClick={() => onAdd(null)} aria-label="요일 미지정 할 일 추가">
            <Icon name="plus" className="h-3.5 w-3.5" />
            추가
          </button>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {unscheduled.map((t) => (
            <MiniTodo key={t._id} todo={t} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}
