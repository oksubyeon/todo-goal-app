'use client';

import Link from 'next/link';
import ProgressBar from './ProgressBar';
import Badge from '@/components/shared/Badge';
import Icon from '@/components/shared/Icon';
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
    <article className="card flex flex-col gap-4 transition hover:shadow-float" data-testid="weekly-card">
      <Link href={`/weekly/${plan._id}`} className="block space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            {label && <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">{label}</div>}
            <div className="font-semibold tracking-tight text-fg">
              {start} ~ {addDaysToKey(start, 6).slice(5)}
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted">
            목표 {doneGoals}/{plan.goals.length}
          </span>
        </div>
        {goal && (
          <Badge tone="outline" icon="target">
            {goal.title}
          </Badge>
        )}
        {plan.goals.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {plan.goals.map((g) => (
              <li key={g._id} className={`flex items-center gap-2 ${g.done ? 'text-faint line-through' : 'text-fg'}`}>
                <Icon name={g.done ? 'check' : 'circle'} className={`h-3.5 w-3.5 ${g.done ? 'text-fg' : 'text-faint'}`} />
                <span className="truncate">{g.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-faint">주간 목표가 없습니다.</p>
        )}
        <ProgressBar value={progress.percent} label="할 일 진행률" detail={`(${progress.done}/${progress.total})`} />
      </Link>
      {(onEdit || onDelete) && (
        <div className="-mx-6 -mb-6 flex justify-end gap-2 border-t border-line-soft px-4 py-1">
          {onEdit && (
            <button className="btn-ghost btn-sm" onClick={onEdit}>
              수정
            </button>
          )}
          {onDelete && (
            <button className="btn-danger btn-sm" onClick={onDelete}>
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  );
}
