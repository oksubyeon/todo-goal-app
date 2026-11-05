import { WeeklyPlan } from '@/models/WeeklyPlan';
import { HttpError, json, optString, readBody, route } from '@/lib/api';
import { countTodosBy, withWeekProgress } from '@/lib/progress';
import { normalizeWeekStart, parseGoalRef, parseWeeklyGoals } from '@/lib/weekly';

export const dynamic = 'force-dynamic';

/** ?weekStart=YYYY-MM-DD 이면 해당 주만, 아니면 최근 주부터 ?limit개 */
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const weekStart = params.get('weekStart');
  const limit = Math.min(Math.max(Number(params.get('limit')) || 20, 1), 100);
  const filter = weekStart ? { weekStart: normalizeWeekStart(weekStart) } : {};
  const plans = await WeeklyPlan.find(filter).sort({ weekStart: -1 }).limit(limit).lean();
  const counts = await countTodosBy(
    'weeklyPlanId',
    plans.map((p) => p._id),
  );
  return json(plans.map((p) => withWeekProgress(p, counts)));
});

export const POST = route(async (req) => {
  const body = await readBody(req);
  const weekStart = normalizeWeekStart(body.weekStart);
  if (await WeeklyPlan.exists({ weekStart })) {
    throw new HttpError(409, '이미 이 주의 주간 계획이 있습니다.');
  }
  const plan = await WeeklyPlan.create({
    weekStart,
    goals: body.goals === undefined ? [] : parseWeeklyGoals(body.goals),
    memo: optString(body, 'memo', 10000) ?? '',
    retrospective: optString(body, 'retrospective', 10000) ?? '',
    goalId: (await parseGoalRef(body)) ?? null,
  });
  return json(withWeekProgress(plan.toObject(), new Map()), 201);
});
