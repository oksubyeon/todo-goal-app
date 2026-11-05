'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import { TodoCardView } from './TodoCard';
import { useStore } from '@/store';
import { computeDrop, sortColumn, type DropTarget } from '@/lib/kanban';
import { STATUSES, type Todo, type TodoStatus } from '@/types';

export default function KanbanBoard({
  todos,
  onOpen,
  onAdd,
}: {
  /** 화면에 보일 할 일(필터 적용 후) */
  todos: Todo[];
  onOpen: (todo: Todo) => void;
  onAdd: (status: TodoStatus) => void;
}) {
  const moveTodo = useStore((s) => s.moveTodo);
  // 키 계산은 필터와 상관없이 전체 할 일로 해야 숨은 카드와 order가 겹치지 않습니다.
  const allTodos = useStore((s) => s.todos);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // 5px 이상 움직여야 드래그로 판단해서 클릭(수정 모달)과 구분합니다.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, sortColumn(todos, s)])) as Record<TodoStatus, Todo[]>,
    [todos],
  );
  const active = activeId ? todos.find((t) => t._id === activeId) : undefined;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const data = e.over.data.current as { type?: string; status?: TodoStatus } | undefined;
    const target: DropTarget =
      data?.type === 'column' && data.status ? { type: 'column', status: data.status } : { type: 'card', id: String(e.over.id) };
    const result = computeDrop(allTodos, String(e.active.id), target);
    if (result) void moveTodo(String(e.active.id), result.status, result.order);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} todos={columns[status]} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>{active ? <TodoCardView todo={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
