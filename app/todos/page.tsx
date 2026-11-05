'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import TodoModal from '@/components/todos/TodoModal';
import Icon from '@/components/shared/Icon';
import PageHeader from '@/components/shared/PageHeader';
import { useLoad, useStore } from '@/store';
import { dateKeyFromStored } from '@/lib/utils';
import type { Todo, TodoStatus } from '@/types';

// dnd-kit은 브라우저 전용 측정을 하므로 SSR을 끕니다.
const KanbanBoard = dynamic(() => import('@/components/todos/KanbanBoard'), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">보드를 불러오는 중…</p>,
});

type ModalState = { todo?: Todo; defaults?: Partial<Todo> } | null;

export default function TodosPage() {
  useLoad('todos', 'plans', 'goals');
  const todos = useStore((s) => s.todos);
  const loaded = useStore((s) => s.todosLoaded);
  const plans = useStore((s) => s.plans);
  const goals = useStore((s) => s.goals);
  const [planFilter, setPlanFilter] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  const visible = useMemo(
    () =>
      todos.filter(
        (t) =>
          (!planFilter || (planFilter === 'none' ? !t.weeklyPlanId : t.weeklyPlanId === planFilter)) &&
          (!goalFilter || (goalFilter === 'none' ? !t.goalId : t.goalId === goalFilter)),
      ),
    [todos, planFilter, goalFilter],
  );

  const onAdd = (status: TodoStatus = 'todo') =>
    setModal({
      defaults: {
        status,
        weeklyPlanId: planFilter && planFilter !== 'none' ? planFilter : null,
        goalId: goalFilter && goalFilter !== 'none' ? goalFilter : null,
      },
    });

  return (
    <div>
      <PageHeader
        title="할 일"
        description="카드를 끌어서 상태와 순서를 바꾸세요. 카드를 누르면 수정할 수 있습니다."
        actions={
          <>
          <select className="input w-auto" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} aria-label="주간 계획 필터">
            <option value="">모든 주</option>
            <option value="none">주간 계획 없음</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>{dateKeyFromStored(p.weekStart)} 주</option>
            ))}
          </select>
          <select className="input w-auto" value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} aria-label="목표 필터">
            <option value="">모든 목표</option>
            <option value="none">목표 없음</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>{g.title}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => onAdd()}>
            <Icon name="plus" />새 할 일
          </button>
          </>
        }
      />

      {loaded ? (
        <KanbanBoard todos={visible} onOpen={(todo) => setModal({ todo })} onAdd={onAdd} />
      ) : (
        <p className="text-sm text-muted">불러오는 중…</p>
      )}

      {modal && <TodoModal todo={modal.todo} defaults={modal.defaults} onClose={() => setModal(null)} />}
    </div>
  );
}
