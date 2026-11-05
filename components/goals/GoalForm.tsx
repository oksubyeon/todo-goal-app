'use client';

import { useState } from 'react';
import type { Goal } from '@/types';
import type { GoalInput } from '@/store/goalSlice';

export default function GoalForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Pick<Goal, 'title' | 'description'>;
  submitLabel: string;
  onSubmit: (values: Required<GoalInput>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('목표 제목을 입력하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), description });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="goal-title">목표 *</label>
        <input id="goal-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 토익 900점 달성" autoFocus maxLength={200} />
      </div>
      <div>
        <label className="label" htmlFor="goal-desc">설명</label>
        <textarea
          id="goal-desc"
          className="input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="왜 이 목표를 세웠는지, 어떻게 달성할지 적어 보세요."
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? '저장 중…' : submitLabel}</button>
      </div>
    </form>
  );
}
