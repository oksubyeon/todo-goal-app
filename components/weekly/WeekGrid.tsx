'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import { compareTodos } from '@/lib/kanban';
import { WEEK_DAYS, addDaysToKey, dateKeyFromStored, toDateKey } from '@/lib/utils';
import PriorityBadge from '@/components/shared/PriorityBadge';
import type { Todo, WeeklyPlan } from '@/types';

const STATUS_DOT = { todo: 'bg-slate-400', doing: 'bg-amber-400', done: 'bg-emerald-500' } as const;

function MiniTodo({ todo, onOpen }: { todo: Todo; onOpen: (t: Todo) => void }) {
  return (
    <button
      onClick={() => onOpen(todo)}
      className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-left text-xs shadow-sm hover:border-indigo-300"
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[todo.status]}`} />
        <span className={`truncate ${todo.status === 'done' ? 'text-slate-400 line-through' : ''}`}>{todo.title}</span>
      </div>
      {todo.priority === 'high' && (
        <div className="mt-1">
          <PriorityBadge priority="high" />
        </div>
      )}
    </button>
  );
}

/** 월~일 7열. 칸의 ＋를 누르면 그 요일로 할 일을 만듭니다. */
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
          return (
            <div
              key={day.value}
              data-testid={`day-${day.value}`}
              className={`flex min-h-[120px] flex-col rounded-lg border p-2 ${date === today ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${day.value === 0 ? 'text-red-500' : day.value === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                  {day.label} <span className="font-normal text-slate-400">{date.slice(5)}</span>
                </span>
                <button className="text-xs text-slate-400 hover:text-indigo-600" onClick={() => onAdd(day.value)} aria-label={`${day.label}요일에 할 일 추가`}>
                  ＋
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {items.map((t) => (
                  <MiniTodo key={t._id} todo={t} onOpen={onOpen} />
                ))}
                {items.length === 0 && (
                  <button className="flex-1 rounded text-[11px] text-slate-300 hover:bg-white hover:text-indigo-500" onClick={() => onAdd(day.value)}>
                    할 일 배치
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">요일 미지정 ({unscheduled.length})</span>
          <button className="text-xs text-slate-400 hover:text-indigo-600" onClick={() => onAdd(null)}>＋ 추가</button>
        </div>
        <div className="grid gap-1 sm:grid-cols-3 lg:grid-cols-4">
          {unscheduled.map((t) => (
            <MiniTodo key={t._id} todo={t} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}
