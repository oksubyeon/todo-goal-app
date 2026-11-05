import { Goal } from '@/models/Goal';
import { Todo } from '@/models/Todo';
import { WeeklyPlan } from '@/models/WeeklyPlan';
import { HttpError, assertId, json, optString, readBody, reqTitle, route, type IdContext } from '@/lib/api';
import { countTodosBy, withGoalProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

async function respond(id: string) {
  const goal = await Goal.findById(id).lean();
  if (!goal) throw new HttpError(404, '목표를 찾을 수 없습니다.');
  return json(withGoalProgress(goal, await countTodosBy('goalId', [id])));
}

export const GET = route<IdContext>(async (_req, { params }) => respond(assertId(params.id)));

export const PUT = route<IdContext>(async (req, { params }) => {
  const id = assertId(params.id);
  const body = await readBody(req);
  const update: Record<string, unknown> = {};
  if ('title' in body) update.title = reqTitle(body);
  const description = optString(body, 'description');
  if (description !== undefined) update.description = description;
  const goal = await Goal.findByIdAndUpdate(id, update, { runValidators: true });
  if (!goal) throw new HttpError(404, '목표를 찾을 수 없습니다.');
  return respond(id);
});

export const DELETE = route<IdContext>(async (_req, { params }) => {
  const id = assertId(params.id);
  const goal = await Goal.findByIdAndDelete(id);
  if (!goal) throw new HttpError(404, '목표를 찾을 수 없습니다.');
  // 연결만 끊고 할 일과 주간 계획은 남겨 둡니다.
  await Promise.all([
    Todo.updateMany({ goalId: id }, { $set: { goalId: null } }),
    WeeklyPlan.updateMany({ goalId: id }, { $set: { goalId: null } }),
  ]);
  return json({ ok: true });
});
