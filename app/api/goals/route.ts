import { Goal } from '@/models/Goal';
import { json, readBody, reqTitle, optString, route } from '@/lib/api';
import { countTodosBy, withGoalProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const goals = await Goal.find().sort({ createdAt: 1 }).lean();
  const counts = await countTodosBy('goalId');
  return json(goals.map((g) => withGoalProgress(g, counts)));
});

export const POST = route(async (req) => {
  const body = await readBody(req);
  const goal = await Goal.create({
    title: reqTitle(body),
    description: optString(body, 'description') ?? '',
  });
  return json(withGoalProgress(goal.toObject(), new Map()), 201);
});
