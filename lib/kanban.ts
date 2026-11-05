import { keyBetween } from '@/lib/fractionalIndex';
import type { Todo, TodoStatus } from '@/types';

type Orderable = Pick<Todo, '_id' | 'status' | 'order' | 'priority'>;

/** High 우선순위는 컬럼 맨 위에 고정, 같은 그룹 안에서는 order 사전순 */
const pinGroup = (t: Orderable) => (t.priority === 'high' ? 0 : 1);

export function compareTodos(a: Orderable, b: Orderable): number {
  return pinGroup(a) - pinGroup(b) || (a.order < b.order ? -1 : a.order > b.order ? 1 : 0);
}

export function sortColumn<T extends Orderable>(todos: T[], status: TodoStatus): T[] {
  return todos.filter((t) => t.status === status).sort(compareTodos);
}

export type DropTarget = { type: 'card'; id: string } | { type: 'column'; status: TodoStatus };

/**
 * 드래그 결과로 이동한 카드의 새 status와 order를 계산합니다.
 * 이동한 카드 1건만 바뀌므로 PATCH 1회로 끝납니다. 위치가 그대로면 null.
 */
export function computeDrop<T extends Orderable>(
  todos: T[],
  activeId: string,
  target: DropTarget,
): { status: TodoStatus; order: string } | null {
  const active = todos.find((t) => t._id === activeId);
  if (!active) return null;

  let status: TodoStatus;
  let overId: string | null = null;
  if (target.type === 'card') {
    if (target.id === activeId) return null;
    const over = todos.find((t) => t._id === target.id);
    if (!over) return null;
    status = over.status;
    overId = over._id;
  } else {
    status = target.status;
  }

  const column = sortColumn(todos, status);
  const rest = column.filter((t) => t._id !== activeId);
  // arrayMove와 같은 의미: 원래 목록에서 over의 자리로 들어갑니다. 컬럼 위에 놓으면 맨 뒤.
  const index = overId === null ? rest.length : column.findIndex((t) => t._id === overId);

  if (status === active.status && column.findIndex((t) => t._id === activeId) === index) return null;

  // 고정 그룹(High / 그 외)을 넘나들지 않도록 같은 그룹의 이웃만 봅니다.
  const group = pinGroup(active);
  let prev: T | undefined;
  for (let i = index - 1; i >= 0; i--) if (pinGroup(rest[i]) === group) { prev = rest[i]; break; }
  let next: T | undefined;
  for (let i = index; i < rest.length; i++) if (pinGroup(rest[i]) === group) { next = rest[i]; break; }

  const prevKey = prev?.order ?? null;
  const nextKey = next?.order ?? null;
  // 중복 키 등으로 순서가 어긋난 경우에는 prev 바로 뒤에 둡니다.
  const order = prevKey !== null && nextKey !== null && prevKey >= nextKey ? keyBetween(prevKey, null) : keyBetween(prevKey, nextKey);
  return { status, order };
}
