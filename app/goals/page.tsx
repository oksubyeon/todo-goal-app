'use client';

import { useState } from 'react';
import Modal from '@/components/shared/Modal';
import Icon from '@/components/shared/Icon';
import PageHeader from '@/components/shared/PageHeader';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';
import { useLoad, useStore } from '@/store';
import type { Goal } from '@/types';

export default function GoalsPage() {
  useLoad('goals', 'todos');
  const goals = useStore((s) => s.goals);
  const loaded = useStore((s) => s.goalsLoaded);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const setNotice = useStore((s) => s.setNotice);
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);

  const remove = async (goal: Goal) => {
    if (!confirm(`'${goal.title}' 목표를 삭제할까요? 연결된 할 일과 주간 계획은 남고 연결만 해제됩니다.`)) return;
    try {
      await deleteGoal(goal._id);
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="1년 목표"
        description="한 해 동안 이루고 싶은 목표를 적고, 주간 계획과 할 일을 연결하세요."
        actions={
          <button className="btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" />새 목표
          </button>
        }
      />

      {!loaded ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : goals.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-strong text-fg">
            <Icon name="target" className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted">아직 1년 목표가 없습니다.</p>
          <button className="btn-primary" onClick={() => setEditing('new')}>첫 목표 만들기</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal._id} goal={goal} onEdit={() => setEditing(goal)} onDelete={() => remove(goal)} />
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? '새 1년 목표' : '목표 수정'} onClose={() => setEditing(null)}>
          <GoalForm
            initial={editing === 'new' ? undefined : editing}
            submitLabel={editing === 'new' ? '만들기' : '저장'}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              if (editing === 'new') await addGoal(values);
              else await updateGoal(editing._id, values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
