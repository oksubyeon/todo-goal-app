'use client';

import Modal from '@/components/shared/Modal';
import TodoForm from './TodoForm';
import { useStore } from '@/store';
import type { Todo } from '@/types';

/** todo가 있으면 수정, 없으면 defaults로 새로 만듭니다. */
export default function TodoModal({
  todo,
  defaults,
  onClose,
}: {
  todo?: Todo | null;
  defaults?: Partial<Todo>;
  onClose: () => void;
}) {
  const addTodo = useStore((s) => s.addTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);

  return (
    <Modal title={todo ? '할 일 수정' : '새 할 일'} onClose={onClose}>
      <TodoForm
        initial={todo ?? defaults ?? {}}
        submitLabel={todo ? '저장' : '추가'}
        onCancel={onClose}
        onSubmit={async (values) => {
          if (todo) await updateTodo(todo._id, values);
          else await addTodo(values);
          onClose();
        }}
        onDelete={
          todo
            ? async () => {
                await deleteTodo(todo._id);
                onClose();
              }
            : undefined
        }
      />
    </Modal>
  );
}
