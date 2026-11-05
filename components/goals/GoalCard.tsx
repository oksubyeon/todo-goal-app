'use client';

import GoalProgress from './GoalProgress';
import type { Goal } from '@/types';

export default function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="card flex flex-col gap-3" data-testid="goal-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800">🎯 {goal.title}</h3>
        <div className="flex shrink-0 gap-1">
          <button className="btn-secondary px-2 py-1 text-xs" onClick={onEdit}>수정</button>
          <button className="btn-danger px-2 py-1 text-xs" onClick={onDelete}>삭제</button>
        </div>
      </div>
      {goal.description ? (
        <p className="whitespace-pre-wrap text-sm text-slate-600">{goal.description}</p>
      ) : (
        <p className="text-sm italic text-slate-400">설명이 없습니다.</p>
      )}
      <div className="mt-auto">
        <GoalProgress goalId={goal._id} />
      </div>
    </article>
  );
}
