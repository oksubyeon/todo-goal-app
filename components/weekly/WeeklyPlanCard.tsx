'use client';

import Link from 'next/link';
import ProgressBar from './ProgressBar';
import { useProgress, useStore } from '@/store';
import { addDaysToKey, dateKeyFromStored } from '@/lib/utils';
import type { WeeklyPlan } from '@/types';

export default function WeeklyPlanCard({
  plan,
  label,
  onEdit,
  onDelete,
}: {
  plan: WeeklyPlan;
  label?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const progress = useProgress('weeklyPlanId', plan._id);
  const goal = useStore((s) => (plan.goalId ? s.goals.find((g) => g._id === plan.goalId) : undefined));
  const start = dateKeyFromStored(plan.weekStart);
  const doneGoals = plan.goals.filter((g) => g.done).length;

  return (
    <article className="card flex flex-col gap-3 transition hover:border-indigo-300" data-testid="weekly-card">
      <Link href={`/weekly/${plan._id}`} className="block space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            {label && <div className="text-xs font-semibold text-indigo-600">{label}</div>}
            <div className="font-semibold">
              {start} ~ {addDaysToKey(start, 6)}
            </div>
          </div>
          <span className="text-xs text-slate-500">
            목표 {doneGoals}/{plan.goals.length}
          </span>
        </div>
        {goal && <div className="text-xs text-indigo-700">🎯 {goal.title}</div>}
        {plan.goals.length > 0 ? (
          <ul className="space-y-0.5 text-sm text-slate-600">
            {plan.goals.map((g) => (
              <li key={g._id} className={g.done ? 'text-slate-400 line-through' : ''}>
                {g.done ? '☑' : '☐'} {g.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-400">주간 목표가 없습니다.</p>
        )}
        <ProgressBar value={progress.percent} label="할 일 진행률" detail={`(${progress.done}/${progress.total})`} />
      </Link>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-1 border-t border-slate-100 pt-2">
          {onEdit && (
            <button className="btn-secondary px-2 py-1 text-xs" onClick={onEdit}>
              수정
            </button>
          )}
          {onDelete && (
            <button className="btn-danger px-2 py-1 text-xs" onClick={onDelete}>
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  );
}
