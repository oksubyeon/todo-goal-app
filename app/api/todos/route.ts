import { Todo } from '@/models/Todo';
import { HttpError, assertId, json, readBody, route } from '@/lib/api';
import { orderAtEnd, parseTodoInput } from '@/lib/todoInput';
import { STATUSES, type TodoStatus } from '@/types';

export const dynamic = 'force-dynamic';

/** 필터: ?status=&weeklyPlanId=&goalId= */
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const filter: Record<string, unknown> = {};
  const status = params.get('status');
  if (status) {
    if (!STATUSES.includes(status as TodoStatus)) throw new HttpError(400, '잘못된 status입니다.');
    filter.status = status;
  }
  for (const key of ['weeklyPlanId', 'goalId'] as const) {
    const v = params.get(key);
    if (v) filter[key] = v === 'none' ? null : assertId(v, key);
  }
  // order는 같은 상태 컬럼 안의 순서이므로 클라이언트는 상태별로 묶어서 씁니다.
  const todos = await Todo.find(filter).sort({ order: 1 }).lean();
  return json(todos);
});

export const POST = route(async (req) => {
  const body = await readBody(req);
  const data = await parseTodoInput(body, false);
  const status = (data.status as TodoStatus | undefined) ?? 'todo';
  // 지정이 없으면 해당 컬럼 맨 뒤에 붙입니다.
  if (!data.order) data.order = await orderAtEnd(status);
  const todo = await Todo.create({ ...data, status });
  return json(todo.toObject(), 201);
});
