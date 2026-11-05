import { HttpError, optEnum, optRef, optString, reqTitle } from '@/lib/api';
import { parseDateKey } from '@/lib/utils';
import { isValidOrderKey, keyBetween } from '@/lib/fractionalIndex';
import { Goal } from '@/models/Goal';
import { Todo } from '@/models/Todo';
import { WeeklyPlan } from '@/models/WeeklyPlan';
import { PRIORITIES, STATUSES, type TodoStatus } from '@/types';

/** status 컬럼 맨 뒤에 들어갈 order 키 */
export async function orderAtEnd(status: TodoStatus): Promise<string> {
  const last = await Todo.findOne({ status }).sort({ order: -1 }).select('order').lean();
  return keyBetween(last?.order ?? null, null);
}

/** 할 일 입력을 검증해 Mongo 업데이트 객체로 만듭니다. partial=true면 들어온 필드만. */
export async function parseTodoInput(body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};

  if (!partial || 'title' in body) out.title = reqTitle(body);
  const description = optString(body, 'description');
  if (description !== undefined) out.description = description;

  const status = optEnum(body, 'status', STATUSES);
  if (status) out.status = status;
  const priority = optEnum(body, 'priority', PRIORITIES);
  if (priority) out.priority = priority;

  if ('dueDate' in body && body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === '') out.dueDate = null;
    else {
      const d = typeof body.dueDate === 'string' ? parseDateKey(body.dueDate.slice(0, 10)) : null;
      if (!d) throw new HttpError(400, 'dueDate는 YYYY-MM-DD 형식이어야 합니다.');
      out.dueDate = d;
    }
  }

  if ('dayOfWeek' in body && body.dayOfWeek !== undefined) {
    const v = body.dayOfWeek;
    if (v === null || v === '') out.dayOfWeek = null;
    else if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 6) out.dayOfWeek = v;
    else throw new HttpError(400, 'dayOfWeek는 0(일)~6(토) 정수여야 합니다.');
  }

  if ('order' in body && body.order !== undefined) {
    if (typeof body.order !== 'string' || !isValidOrderKey(body.order)) {
      throw new HttpError(400, 'order가 올바르지 않습니다.');
    }
    out.order = body.order;
  }

  const weeklyPlanId = optRef(body, 'weeklyPlanId');
  if (weeklyPlanId !== undefined) {
    if (weeklyPlanId && !(await WeeklyPlan.exists({ _id: weeklyPlanId }))) {
      throw new HttpError(400, '존재하지 않는 주간 계획입니다.');
    }
    out.weeklyPlanId = weeklyPlanId;
  }
  const goalId = optRef(body, 'goalId');
  if (goalId !== undefined) {
    if (goalId && !(await Goal.exists({ _id: goalId }))) throw new HttpError(400, '존재하지 않는 목표입니다.');
    out.goalId = goalId;
  }
  return out;
}
