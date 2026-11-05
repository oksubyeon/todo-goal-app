'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TodoCard from './TodoCard';
import Icon from '@/components/shared/Icon';
import { STATUS_LABEL, type Todo, type TodoStatus } from '@/types';

const ACCENT: Record<TodoStatus, string> = {
  todo: 'bg-slate-400',
  doing: 'bg-amber-400',
  done: 'bg-emerald-500',
};

export default function KanbanColumn({
  status,
  todos,
  onOpen,
  onAdd,
}: {
  status: TodoStatus;
  todos: Todo[];
  onOpen: (todo: Todo) => void;
  onAdd: (status: TodoStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}`, data: { type: 'column', status } });

  return (
    <section
      ref={setNodeRef}
      data-testid={`column-${status}`}
      className={`flex min-h-[240px] flex-col rounded-xl border p-3 transition ${
        isOver ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-transparent bg-subtle'
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <span className={`h-2 w-2 rounded-full ${ACCENT[status]}`} />
          {STATUS_LABEL[status]}
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-muted">{todos.length}</span>
        </h2>
        <button className="icon-btn h-7 w-7" onClick={() => onAdd(status)} aria-label={`${STATUS_LABEL[status]}에 추가`}>
          <Icon name="plus" />
        </button>
      </header>
      <SortableContext items={todos.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {todos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} onOpen={onOpen} />
          ))}
          {todos.length === 0 && (
            <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line py-8 text-xs text-faint">
              여기로 끌어다 놓으세요
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
