'use client';

import type { WeeklyGoal } from '@/types';

export default function WeeklyGoalItem({ goal, onToggle }: { goal: WeeklyGoal; onToggle: (done: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        checked={goal.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className={`text-sm ${goal.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{goal.text}</span>
    </label>
  );
}
