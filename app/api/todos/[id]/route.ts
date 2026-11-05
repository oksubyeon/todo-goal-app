import { Todo } from '@/models/Todo';
import { HttpError, assertId, json, readBody, route, type IdContext } from '@/lib/api';
import { orderAtEnd, parseTodoInput } from '@/lib/todoInput';
import type { TodoStatus } from '@/types';

export const dynamic = 'force-dynamic';

const NOT_FOUND = '할 일을 찾을 수 없습니다.';

export const GET = route<IdContext>(async (_req, { params }) => {
  const todo = await Todo.findById(assertId(params.id)).lean();
  if (!todo) throw new HttpError(404, NOT_FOUND);
  return json(todo);
});

async function update(req: Request, id: string) {
  const data = await parseTodoInput(await readBody(req), true);
  if (data.status && !data.order) {
    // 폼에서 상태만 바꾼 경우: 새 컬럼 맨 뒤로 보내 order 중복을 막습니다.
    const current = await Todo.findById(id).select('status').lean();
    if (current && current.status !== data.status) data.order = await orderAtEnd(data.status as TodoStatus);
  }
  const todo = await Todo.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!todo) throw new HttpError(404, NOT_FOUND);
  return json(todo);
}

/** 폼 수정 */
export const PUT = route<IdContext>(async (req, { params }) => update(req, assertId(params.id)));

/** 부분 수정. 칸반 이동은 { status, order } 한 번으로 끝납니다. */
export const PATCH = route<IdContext>(async (req, { params }) => update(req, assertId(params.id)));

export const DELETE = route<IdContext>(async (_req, { params }) => {
  const todo = await Todo.findByIdAndDelete(assertId(params.id));
  if (!todo) throw new HttpError(404, NOT_FOUND);
  return json({ ok: true });
});
