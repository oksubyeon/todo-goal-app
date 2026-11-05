import { WeeklyPlan } from '@/models/WeeklyPlan';
import { Todo } from '@/models/Todo';
import { HttpError, assertId, json, optString, readBody, route, type IdContext } from '@/lib/api';
import { countTodosBy, withWeekProgress } from '@/lib/progress';
import { normalizeWeekStart, parseGoalRef, parseWeeklyGoals } from '@/lib/weekly';

export const dynamic = 'force-dynamic';

const NOT_FOUND = '주간 계획을 찾을 수 없습니다.';

async function respond(id: string) {
  const plan = await WeeklyPlan.findById(id).lean();
  if (!plan) throw new HttpError(404, NOT_FOUND);
  return json(withWeekProgress(plan, await countTodosBy('weeklyPlanId', [id])));
}

export const GET = route<IdContext>(async (_req, { params }) => respond(assertId(params.id)));

export const PUT = route<IdContext>(async (req, { params }) => {
  const id = assertId(params.id);
  const body = await readBody(req);
  const update: Record<string, unknown> = {};
  if (body.weekStart !== undefined) {
    const weekStart = normalizeWeekStart(body.weekStart);
    if (await WeeklyPlan.exists({ weekStart, _id: { $ne: id } })) {
      throw new HttpError(409, '이미 이 주의 주간 계획이 있습니다.');
    }
    update.weekStart = weekStart;
  }
  if (body.goals !== undefined) update.goals = parseWeeklyGoals(body.goals);
  const memo = optString(body, 'memo', 10000);
  if (memo !== undefined) update.memo = memo;
  const retrospective = optString(body, 'retrospective', 10000);
  if (retrospective !== undefined) update.retrospective = retrospective;
  const goalId = await parseGoalRef(body);
  if (goalId !== undefined) update.goalId = goalId;

  const plan = await WeeklyPlan.findByIdAndUpdate(id, update, { runValidators: true });
  if (!plan) throw new HttpError(404, NOT_FOUND);
  return respond(id);
});

/** 주간 목표 하나의 완료 여부를 바꿉니다: { goalIndex: number, done: boolean } */
export const PATCH = route<IdContext>(async (req, { params }) => {
  const id = assertId(params.id);
  const body = await readBody(req);
  const index = body.goalIndex;
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    throw new HttpError(400, 'goalIndex는 0 이상의 정수여야 합니다.');
  }
  if (typeof body.done !== 'boolean') throw new HttpError(400, 'done은 boolean이어야 합니다.');
  const plan = await WeeklyPlan.findById(id);
  if (!plan) throw new HttpError(404, NOT_FOUND);
  if (index >= plan.goals.length) throw new HttpError(400, '해당 주간 목표가 없습니다.');
  plan.goals[index].done = body.done;
  await plan.save();
  return respond(id);
});

export const DELETE = route<IdContext>(async (_req, { params }) => {
  const id = assertId(params.id);
  const plan = await WeeklyPlan.findByIdAndDelete(id);
  if (!plan) throw new HttpError(404, NOT_FOUND);
  await Todo.updateMany({ weeklyPlanId: id }, { $set: { weeklyPlanId: null, dayOfWeek: null } });
  return json({ ok: true });
});
