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
      className={`rounded-card border bg-surface p-4 text-sm transition ${
        dragging ? 'rotate-1 border-fg/30 shadow-float' : 'border-line hover:shadow-float'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[15px] font-semibold leading-snug ${todo.status === 'done' ? 'text-faint line-through' : 'text-fg'}`}>{todo.title}</p>
        <PriorityBadge priority={todo.priority} />
      </div>
      {(todo.dueDate || todo.dayOfWeek != null || plan || goal) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {todo.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${overdue ? 'font-semibold text-danger' : 'text-muted'}`}
              data-overdue={overdue || undefined}
            >
              <Icon name="clock" className="h-3 w-3" />
              {dateKeyFromStored(todo.dueDate)}
              {overdue && ' (지남)'}
            </span>
          )}
          {todo.dayOfWeek != null && <Badge>{dayLabel(todo.dayOfWeek)}요일</Badge>}
          {plan && (
            <Badge tone="quiet" icon="calendar">
              {dateKeyFromStored(plan.weekStart)} 주
            </Badge>
          )}
          {goal && (
            <Badge tone="outline" icon="target">
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
      className={`cursor-grab touch-none rounded-card active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onOpen(todo)}
      data-testid="todo-card"
      {...attributes}
      {...listeners}
    >
      <TodoCardView todo={todo} />
    </div>
  );
}
