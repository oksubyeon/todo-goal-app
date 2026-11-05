'use client';

import type { WeeklyGoal } from '@/types';

export default function WeeklyGoalItem({ goal, onToggle }: { goal: WeeklyGoal; onToggle: (done: boolean) => void }) {
  return (
    <label className="-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-subtle">
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded accent-fg"
        checked={goal.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className={`text-sm ${goal.done ? 'text-faint line-through' : 'text-fg'}`}>{goal.text}</span>
    </label>
  );
}
