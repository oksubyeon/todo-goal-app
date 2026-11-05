'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TodoCard from './TodoCard';
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
      className={`flex min-h-[200px] flex-col rounded-lg border p-3 transition ${
        isOver ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-slate-100/70'
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className={`h-2 w-2 rounded-full ${ACCENT[status]}`} />
          {STATUS_LABEL[status]}
          <span className="rounded-full bg-white px-2 text-xs text-slate-500">{todos.length}</span>
        </h2>
        <button className="text-sm text-slate-500 hover:text-indigo-600" onClick={() => onAdd(status)} aria-label={`${STATUS_LABEL[status]}에 추가`}>
          ＋
        </button>
      </header>
      <SortableContext items={todos.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {todos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} onOpen={onOpen} />
          ))}
          {todos.length === 0 && <p className="py-6 text-center text-xs text-slate-400">여기로 끌어다 놓으세요</p>}
        </div>
      </SortableContext>
    </section>
  );
}
