'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/shared/Modal';
import ProgressBar from '@/components/weekly/ProgressBar';
import WeeklyGoalItem from '@/components/weekly/WeeklyGoalItem';
import WeeklyPlanForm from '@/components/weekly/WeeklyPlanForm';
import TodoModal from '@/components/todos/TodoModal';
import { useLoad, useStore } from '@/store';
import { compareTodos } from '@/lib/kanban';
import { addDaysToKey, dateKeyFromStored, percent, weekKey } from '@/lib/utils';
import { STATUSES, STATUS_LABEL, type Todo } from '@/types';

const STATUS_COLOR = { todo: 'text-slate-700', doing: 'text-amber-600', done: 'text-emerald-600' } as const;

export default function DashboardPage() {
  useLoad('plans', 'goals', 'todos');
  const loaded = useStore((s) => s.plansLoaded && s.goalsLoaded && s.todosLoaded);
  const plans = useStore((s) => s.plans);
  const goals = useStore((s) => s.goals);
  const todos = useStore((s) => s.todos);
  const addPlan = useStore((s) => s.addPlan);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const [creating, setCreating] = useState(false);
  const [todoModal, setTodoModal] = useState<{ todo?: Todo; defaults?: Partial<Todo> } | null>(null);

  const thisWeek = weekKey();
  const plan = plans.find((p) => dateKeyFromStored(p.weekStart) === thisWeek);
  const weekTodos = useMemo(() => (plan ? todos.filter((t) => t.weeklyPlanId === plan._id) : []), [todos, plan]);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, weekTodos.filter((t) => t.status === s).length])) as Record<string, number>;
  const progress = percent(counts.done, weekTodos.length);
  const todayDow = new Date().getDay();
  const todayTodos = weekTodos.filter((t) => t.dayOfWeek === todayDow).sort(compareTodos);

  if (!loaded) return <p className="text-sm text-slate-500">불러오는 중…</p>;

  const steps = [
    { done: goals.length > 0, label: '1년 목표 세우기', href: '/goals' },
    { done: Boolean(plan), label: '이번 주 계획 작성하기', action: () => setCreating(true) },
    { done: weekTodos.length > 0, label: '주간 계획에 할 일 만들기', href: plan ? `/weekly/${plan._id}` : undefined },
  ];
  const onboarding = steps.some((s) => !s.done);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="text-sm text-slate-500">
          이번 주 {thisWeek} ~ {addDaysToKey(thisWeek, 6)}
        </p>
      </div>

      {onboarding && (
        <section className="card border-indigo-200 bg-indigo-50/50">
          <h2 className="mb-2 text-sm font-semibold text-indigo-800">시작하기: 목표 → 주간 계획 → 할 일</h2>
          <ol className="space-y-1 text-sm">
            {steps.map((s, i) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className={s.done ? 'text-emerald-600' : 'text-slate-400'}>{s.done ? '✔' : `${i + 1}.`}</span>
                {s.done ? (
                  <span className="text-slate-500 line-through">{s.label}</span>
                ) : s.href ? (
                  <Link href={s.href} className="font-medium text-indigo-700 underline">{s.label}</Link>
                ) : s.action ? (
                  <button onClick={s.action} className="font-medium text-indigo-700 underline">{s.label}</button>
                ) : (
                  <span>{s.label}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!plan ? (
        <section className="card py-8 text-center">
          <p className="text-slate-600">이번 주 계획이 아직 없습니다.</p>
          <button className="btn-primary mt-3" onClick={() => setCreating(true)}>이번 주 계획 만들기</button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <section className="card space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">이번 주 목표</h2>
                <Link href={`/weekly/${plan._id}`} className="text-xs text-indigo-600 hover:underline">주간 계획 열기 →</Link>
              </div>
              {plan.goals.length === 0 ? (
                <p className="text-sm italic text-slate-400">주간 목표가 없습니다.</p>
              ) : (
                plan.goals.map((g, i) => <WeeklyGoalItem key={g._id} goal={g} onToggle={(done) => toggleGoal(plan._id, i, done)} />)
              )}
              <ProgressBar value={progress} label="주간 진행률" detail={`(${counts.done}/${weekTodos.length})`} />
            </section>
            <section className="card">
              <h2 className="mb-3 text-sm font-semibold">이번 주 할 일</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {STATUSES.map((s) => (
                  <div key={s} className="rounded-md bg-slate-50 py-3" data-testid={`count-${s}`}>
                    <div className={`text-2xl font-bold ${STATUS_COLOR[s]}`}>{counts[s]}</div>
                    <div className="text-xs text-slate-500">{STATUS_LABEL[s]}</div>
                  </div>
                ))}
              </div>
              <Link href="/todos" className="btn-secondary mt-3 w-full">칸반 보드로</Link>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">오늘 할 일</h2>
                <button
                  className="text-xs text-indigo-600 hover:underline"
                  onClick={() => setTodoModal({ defaults: { weeklyPlanId: plan._id, dayOfWeek: todayDow, goalId: plan.goalId ?? null } })}
                >
                  ＋ 추가
                </button>
              </div>
              {todayTodos.length === 0 ? (
                <p className="text-sm italic text-slate-400">오늘로 배치된 할 일이 없습니다.</p>
              ) : (
                <ul className="space-y-1">
                  {todayTodos.map((t) => (
                    <li key={t._id}>
                      <button onClick={() => setTodoModal({ todo: t })} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-slate-50">
                        <span className="text-xs text-slate-400">[{STATUS_LABEL[t.status]}]</span>
                        <span className={t.status === 'done' ? 'text-slate-400 line-through' : ''}>{t.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card space-y-3">
              <h2 className="text-sm font-semibold">1년 목표별 이번 주 할 일</h2>
              {goals.length === 0 ? (
                <p className="text-sm italic text-slate-400">1년 목표가 없습니다.</p>
              ) : (
                goals.map((g) => {
                  const linked = weekTodos.filter((t) => t.goalId === g._id);
                  const done = linked.filter((t) => t.status === 'done').length;
                  return (
                    <div key={g._id} data-testid="goal-week-row">
                      <ProgressBar value={percent(done, linked.length)} label={`🎯 ${g.title}`} detail={`할 일 ${linked.length}개 중 ${done}개 완료`} />
                    </div>
                  );
                })
              )}
            </section>
          </div>
        </>
      )}

      {creating && (
        <Modal title="이번 주 계획 만들기" onClose={() => setCreating(false)}>
          <WeeklyPlanForm
            defaultWeekStart={thisWeek}
            onCancel={() => setCreating(false)}
            onSubmit={async (values) => {
              await addPlan(values);
              setCreating(false);
            }}
          />
        </Modal>
      )}
      {todoModal && <TodoModal todo={todoModal.todo} defaults={todoModal.defaults} onClose={() => setTodoModal(null)} />}
    </div>
  );
}
