'use client';

import GoalProgress from './GoalProgress';
import Icon from '@/components/shared/Icon';
import type { Goal } from '@/types';

export default function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="card flex flex-col gap-4 transition hover:shadow-float" data-testid="goal-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-strong text-fg">
          <Icon name="target" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-fg">{goal.title}</h3>
          {goal.description ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{goal.description}</p>
          ) : (
            <p className="mt-1 text-sm text-faint">설명이 없습니다.</p>
          )}
        </div>
      </div>
      <div className="mt-auto">
        <GoalProgress goalId={goal._id} />
      </div>
      <div className="-mx-6 -mb-6 flex justify-end gap-2 border-t border-line-soft px-4 py-1">
        <button className="btn-ghost btn-sm" onClick={onEdit}>수정</button>
        <button className="btn-danger btn-sm" onClick={onDelete}>삭제</button>
      </div>
    </article>
  );
}
