'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/shared/Modal';
import Icon from '@/components/shared/Icon';
import PageHeader from '@/components/shared/PageHeader';
import ProgressBar from '@/components/weekly/ProgressBar';
import WeeklyGoalItem from '@/components/weekly/WeeklyGoalItem';
import WeeklyPlanForm from '@/components/weekly/WeeklyPlanForm';
import TodoModal from '@/components/todos/TodoModal';
import { useLoad, useStore } from '@/store';
import { compareTodos } from '@/lib/kanban';
import { dateKeyFromStored, percent, weekKey } from '@/lib/utils';
import { STATUSES, STATUS_LABEL, type Todo } from '@/types';

const STATUS_COLOR = {
  todo: 'text-fg',
  doing: 'text-fg',
  done: 'text-fg',
} as const;
const STATUS_DOT = { todo: 'bg-faint', doing: 'bg-amber-400', done: 'bg-emerald-500' } as const;

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

  if (!loaded) return <p className="text-sm text-muted">불러오는 중…</p>;

  const steps = [
    { done: goals.length > 0, label: '1년 목표 세우기', href: '/goals' },
    { done: Boolean(plan), label: '이번 주 계획 작성하기', action: () => setCreating(true) },
    { done: weekTodos.length > 0, label: '주간 계획에 할 일 만들기', href: plan ? `/weekly/${plan._id}` : undefined },
  ];
  const onboarding = steps.some((s) => !s.done);

  return (
    <div className="space-y-6">
      <PageHeader title="대시보드" description="이번 주 목표와 오늘 할 일을 한눈에 확인하세요." />

      {onboarding && (
        <section className="rounded-card bg-subtle p-6">
          <h2 className="mb-4 text-base font-semibold text-fg">시작하기: 목표 → 주간 계획 → 할 일</h2>
          <ol className="space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={s.label} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    s.done ? 'bg-fg text-canvas' : 'bg-surface text-muted ring-1 ring-line'
                  }`}
                >
                  {s.done ? <Icon name="check" className="h-3 w-3" /> : i + 1}
                </span>
                {s.done ? (
                  <span className="text-muted line-through">{s.label}</span>
                ) : s.href ? (
                  <Link href={s.href} className="font-medium text-fg underline underline-offset-4 hover:text-brand-600">{s.label}</Link>
                ) : s.action ? (
                  <button onClick={s.action} className="font-medium text-fg underline underline-offset-4 hover:text-brand-600">{s.label}</button>
                ) : (
                  <span className="text-fg">{s.label}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!plan ? (
        <section className="card flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-strong text-fg">
            <Icon name="calendar" className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted">이번 주 계획이 아직 없습니다.</p>
          <button className="btn-primary" onClick={() => setCreating(true)}>이번 주 계획 만들기</button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <section className="card space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="card-title">이번 주 목표</h2>
                <Link href={`/weekly/${plan._id}`} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  주간 계획 열기 →
                </Link>
              </div>
              {plan.goals.length === 0 ? (
                <p className="text-sm text-faint">주간 목표가 없습니다.</p>
              ) : (
                <div>
                  {plan.goals.map((g, i) => (
                    <WeeklyGoalItem key={g._id} goal={g} onToggle={(done) => toggleGoal(plan._id, i, done)} />
                  ))}
                </div>
              )}
              <ProgressBar value={progress} label="주간 진행률" detail={`(${counts.done}/${weekTodos.length})`} />
            </section>
            <section className="card flex flex-col gap-4">
              <h2 className="card-title">이번 주 할 일</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {STATUSES.map((s) => (
                  <div key={s} className="rounded-lg bg-subtle py-3" data-testid={`count-${s}`}>
                    <div className={`text-2xl font-semibold tabular-nums ${STATUS_COLOR[s]}`}>{counts[s]}</div>
                    <div className="mt-0.5 text-xs text-muted">{STATUS_LABEL[s]}</div>
                  </div>
                ))}
              </div>
              <Link href="/todos" className="btn-secondary mt-auto w-full">
                칸반 보드로
              </Link>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="card-title">오늘 할 일</h2>
                <button
                  className="btn-ghost btn-sm -mr-2"
                  aria-label="오늘 할 일 추가"
                  onClick={() => setTodoModal({ defaults: { weeklyPlanId: plan._id, dayOfWeek: todayDow, goalId: plan.goalId ?? null } })}
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  추가
                </button>
              </div>
              {todayTodos.length === 0 ? (
                <p className="text-sm text-faint">오늘로 배치된 할 일이 없습니다.</p>
              ) : (
                <ul className="-mx-2 space-y-0.5">
                  {todayTodos.map((t) => (
                    <li key={t._id}>
                      <button
                        onClick={() => setTodoModal({ todo: t })}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-subtle"
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[t.status]}`} aria-label={STATUS_LABEL[t.status]} />
                        <span className={t.status === 'done' ? 'text-faint line-through' : 'text-fg'}>{t.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card space-y-4">
              <h2 className="card-title">1년 목표별 이번 주 할 일</h2>
              {goals.length === 0 ? (
                <p className="text-sm text-faint">1년 목표가 없습니다.</p>
              ) : (
                goals.map((g) => {
                  const linked = weekTodos.filter((t) => t.goalId === g._id);
                  const done = linked.filter((t) => t.status === 'done').length;
                  return (
                    <div key={g._id} data-testid="goal-week-row">
                      <ProgressBar value={percent(done, linked.length)} label={g.title} detail={`할 일 ${linked.length}개 중 ${done}개 완료`} />
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
