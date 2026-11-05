'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/shared/Modal';
import ProgressBar from '@/components/weekly/ProgressBar';
import WeekGrid from '@/components/weekly/WeekGrid';
import WeeklyGoalItem from '@/components/weekly/WeeklyGoalItem';
import WeeklyPlanForm from '@/components/weekly/WeeklyPlanForm';
import TodoModal from '@/components/todos/TodoModal';
import { useLoad, useProgress, useStore } from '@/store';
import { addDaysToKey, dateKeyFromStored } from '@/lib/utils';
import type { Todo, WeeklyPlan } from '@/types';

function SavableText({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // 편집 모달 등 다른 곳에서 값이 바뀌면 입력란도 새 값으로 맞춥니다.
  useEffect(() => setText(value), [value]);
  const dirty = text !== value;
  const id = `text-${label}`;

  const save = async () => {
    setState('saving');
    try {
      await onSave(text);
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="card space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <textarea id={id} className="input" rows={5} value={text} placeholder={placeholder} onChange={(e) => { setText(e.target.value); setState('idle'); }} />
      <div className="flex items-center justify-end gap-2 text-xs">
        {state === 'saved' && !dirty && <span className="text-emerald-600">저장됨</span>}
        {state === 'error' && <span className="text-red-600">저장 실패</span>}
        <button className="btn-primary" disabled={!dirty || state === 'saving'} onClick={save}>
          {state === 'saving' ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

function PlanDetail({ plan }: { plan: WeeklyPlan }) {
  const router = useRouter();
  const goals = useStore((s) => s.goals);
  const updatePlan = useStore((s) => s.updatePlan);
  const deletePlan = useStore((s) => s.deletePlan);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const setNotice = useStore((s) => s.setNotice);
  const progress = useProgress('weeklyPlanId', plan._id);
  const [editing, setEditing] = useState(false);
  const [todoModal, setTodoModal] = useState<{ todo?: Todo; defaults?: Partial<Todo> } | null>(null);

  const start = dateKeyFromStored(plan.weekStart);
  const goal = goals.find((g) => g._id === plan.goalId);

  const remove = async () => {
    if (!confirm('이 주간 계획을 삭제할까요? 할 일은 남고 주간 계획 연결만 해제됩니다.')) return;
    try {
      await deletePlan(plan._id);
      router.push('/weekly');
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/weekly" className="text-xs text-slate-500 hover:text-indigo-600">← 주간 계획</Link>
          <h1 className="text-xl font-bold">
            {start} ~ {addDaysToKey(start, 6)}
          </h1>
          {goal ? (
            <p className="text-sm text-indigo-700">🎯 {goal.title}</p>
          ) : (
            <p className="text-sm text-slate-400">연결된 1년 목표 없음</p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setEditing(true)}>목표·메모 편집</button>
          <button className="btn-danger" onClick={remove}>삭제</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold">이번 주 목표</h2>
          {plan.goals.length === 0 ? (
            <p className="text-sm italic text-slate-400">주간 목표가 없습니다. 편집에서 추가하세요.</p>
          ) : (
            <div>
              {plan.goals.map((g, i) => (
                <WeeklyGoalItem key={g._id} goal={g} onToggle={(done) => toggleGoal(plan._id, i, done)} />
              ))}
            </div>
          )}
          <ProgressBar value={progress.percent} label="주간 진행률 (완료한 할 일)" detail={`(${progress.done}/${progress.total})`} />
        </section>
        <div className="lg:col-span-2">
          <SavableText
            key={`memo-${plan._id}`}
            label="주간 메모"
            value={plan.memo}
            placeholder="이번 주에 기억할 것, 아이디어 등을 적어 두세요."
            onSave={async (memo) => {
              await updatePlan(plan._id, { memo });
            }}
          />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">요일별 할 일</h2>
        <WeekGrid
          plan={plan}
          onOpen={(todo) => setTodoModal({ todo })}
          onAdd={(dayOfWeek) => setTodoModal({ defaults: { weeklyPlanId: plan._id, dayOfWeek, goalId: plan.goalId ?? null } })}
        />
      </section>

      <SavableText
        key={`retro-${plan._id}`}
        label="주간 회고"
        value={plan.retrospective}
        placeholder="잘한 점, 아쉬운 점, 다음 주에 바꿀 점을 적어 보세요."
        onSave={async (retrospective) => {
          await updatePlan(plan._id, { retrospective });
        }}
      />

      {editing && (
        <Modal title="주간 계획 편집" onClose={() => setEditing(false)}>
          <WeeklyPlanForm
            plan={plan}
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              await updatePlan(plan._id, values);
              setEditing(false);
            }}
          />
        </Modal>
      )}
      {todoModal && <TodoModal todo={todoModal.todo} defaults={todoModal.defaults} onClose={() => setTodoModal(null)} />}
    </div>
  );
}

export default function WeeklyDetailPage({ params }: { params: { id: string } }) {
  useLoad('plans', 'goals', 'todos');
  const loaded = useStore((s) => s.plansLoaded);
  const plan = useStore((s) => s.plans.find((p) => p._id === params.id));

  if (!loaded) return <p className="text-sm text-slate-500">불러오는 중…</p>;
  if (!plan) {
    return (
      <div className="card text-center">
        <p className="text-slate-600">주간 계획을 찾을 수 없습니다.</p>
        <Link href="/weekly" className="btn-secondary mt-3">주간 계획 목록으로</Link>
      </div>
    );
  }
  return <PlanDetail plan={plan} />;
}
