'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '@/components/shared/Badge';
import Icon from '@/components/shared/Icon';
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
      className={`rounded-lg border bg-surface p-3.5 text-sm transition ${
        dragging ? 'rotate-1 border-brand-300 shadow-lift dark:border-brand-500/50' : 'border-line shadow-soft hover:shadow-lift'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`font-medium leading-snug ${todo.status === 'done' ? 'text-faint line-through' : 'text-fg'}`}>{todo.title}</p>
        <PriorityBadge priority={todo.priority} />
      </div>
      {(todo.dueDate || todo.dayOfWeek != null || plan || goal) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {todo.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted'}`}
              data-overdue={overdue || undefined}
            >
              <Icon name="clock" className="h-3 w-3" />
              {dateKeyFromStored(todo.dueDate)}
              {overdue && ' (지남)'}
            </span>
          )}
          {todo.dayOfWeek != null && <Badge>{dayLabel(todo.dayOfWeek)}요일</Badge>}
          {plan && (
            <Badge tone="sky" icon="calendar">
              {dateKeyFromStored(plan.weekStart)} 주
            </Badge>
          )}
          {goal && (
            <Badge tone="brand" icon="target">
              {goal.title}
            </Badge>
          )}
        </div>
      )}
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
      className={`cursor-grab touch-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onOpen(todo)}
      data-testid="todo-card"
      {...attributes}
      {...listeners}
    >
      <TodoCardView todo={todo} />
    </div>
  );
}
