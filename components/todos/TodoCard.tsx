'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '@/components/shared/Badge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import { useStore } from '@/store';
import { dateKeyFromStored, dayLabel, isOverdue } from '@/lib/utils';
import type { Todo } from '@/types';

export function TodoCardView({ todo, dragging = false }: { todo: Todo; dragging?: boolean }) {
  const goal = useStore((s) => (todo.goalId ? s.goals.find((g) => g._id === todo.goalId) : undefined));
  const plan = useStore((s) => (todo.weeklyPlanId ? s.plans.find((p) => p._id === todo.weeklyPlanId) : undefined));
  const overdue = isOverdue(todo.dueDate, todo.status);

  return (
    <div
      className={`rounded-md border bg-white p-3 text-sm shadow-sm ${
        dragging ? 'rotate-1 border-indigo-300 shadow-lg' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`font-medium ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{todo.title}</p>
        <PriorityBadge priority={todo.priority} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {todo.dueDate && (
          <span className={`text-[11px] ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`} data-overdue={overdue || undefined}>
            📅 {dateKeyFromStored(todo.dueDate)}
            {overdue && ' (지남)'}
          </span>
        )}
        {todo.dayOfWeek != null && <Badge>{dayLabel(todo.dayOfWeek)}요일</Badge>}
        {plan && <Badge className="bg-sky-50 text-sky-700">🗓️ {dateKeyFromStored(plan.weekStart)} 주</Badge>}
        {goal && <Badge className="bg-indigo-50 text-indigo-700">🎯 {goal.title}</Badge>}
      </div>
    </div>
  );
}

export default function TodoCard({ todo, onOpen }: { todo: Todo; onOpen: (todo: Todo) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo._id,
    data: { type: 'card' },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onOpen(todo)}
      data-testid="todo-card"
      {...attributes}
      {...listeners}
    >
      <TodoCardView todo={todo} />
    </div>
  );
}
