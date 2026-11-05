import mongoose from 'mongoose';
import { Todo } from '@/models/Todo';
import { percent } from '@/lib/utils';

type Counts = { total: number; done: number };

/** field(goalId 또는 weeklyPlanId)별 할 일 수와 완료 수 */
export async function countTodosBy(
  field: 'goalId' | 'weeklyPlanId',
  ids?: (string | mongoose.Types.ObjectId)[],
): Promise<Map<string, Counts>> {
  const match: Record<string, unknown> = ids
    ? { [field]: { $in: ids.map((id) => new mongoose.Types.ObjectId(String(id))) } }
    : { [field]: { $ne: null } };
  const rows: { _id: mongoose.Types.ObjectId; total: number; done: number }[] = await Todo.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$' + field,
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { total: r.total, done: r.done }]));
}

export function withGoalProgress<T extends { _id: unknown }>(goal: T, counts: Map<string, Counts>) {
  const c = counts.get(String(goal._id)) ?? { total: 0, done: 0 };
  return { ...goal, todoCount: c.total, doneCount: c.done, progress: percent(c.done, c.total) };
}

export function withWeekProgress<T extends { _id: unknown }>(plan: T, counts: Map<string, Counts>) {
  const c = counts.get(String(plan._id)) ?? { total: 0, done: 0 };
  return { ...plan, todoTotal: c.total, todoDone: c.done, todoProgress: percent(c.done, c.total) };
}
