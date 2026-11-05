'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/shared/Modal';
import WeeklyPlanCard from '@/components/weekly/WeeklyPlanCard';
import WeeklyPlanForm from '@/components/weekly/WeeklyPlanForm';
import { useLoad, useStore } from '@/store';
import { addDaysToKey, dateKeyFromStored, weekKey } from '@/lib/utils';
import type { WeeklyPlan } from '@/types';

const LABELS = ['이번 주', '지난주', '2주 전', '3주 전'];

export default function WeeklyPage() {
  useLoad('plans', 'goals', 'todos');
  const router = useRouter();
  const plans = useStore((s) => s.plans);
  const loaded = useStore((s) => s.plansLoaded);
  const addPlan = useStore((s) => s.addPlan);
  const updatePlan = useStore((s) => s.updatePlan);
  const deletePlan = useStore((s) => s.deletePlan);
  const setNotice = useStore((s) => s.setNotice);
  const [creating, setCreating] = useState<string | null>(null);
  const [editing, setEditing] = useState<WeeklyPlan | null>(null);

  const remove = async (plan: WeeklyPlan) => {
    if (!confirm(`${dateKeyFromStored(plan.weekStart)} 주 계획을 삭제할까요? 할 일은 남고 주간 계획 연결만 해제됩니다.`)) return;
    try {
      await deletePlan(plan._id);
    } catch (err) {
      setNotice((err as Error).message);
    }
  };
  const actions = (plan: WeeklyPlan) => ({ onEdit: () => setEditing(plan), onDelete: () => remove(plan) });

  const thisWeek = weekKey();
  const recentKeys = LABELS.map((_, i) => addDaysToKey(thisWeek, -7 * i));
  const byKey = new Map(plans.map((p) => [dateKeyFromStored(p.weekStart), p]));
  const others = plans.filter((p) => !recentKeys.includes(dateKeyFromStored(p.weekStart)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">주간 계획</h1>
          <p className="text-sm text-slate-500">1년 목표를 바탕으로 이번 주 목표를 세우고, 요일별로 할 일을 배치하세요.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(thisWeek)}>＋ 주간 계획 만들기</button>
      </div>

      {!loaded ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-600">최근 4주</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recentKeys.map((key, i) => {
                const plan = byKey.get(key);
                return plan ? (
                  <WeeklyPlanCard key={key} plan={plan} label={LABELS[i]} {...actions(plan)} />
                ) : (
                  <div key={key} className="card flex flex-col items-start justify-between gap-3 border-dashed">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">{LABELS[i]}</div>
                      <div className="font-semibold text-slate-500">
                        {key} ~ {addDaysToKey(key, 6)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">계획이 없습니다.</p>
                    <button className="btn-secondary text-xs" onClick={() => setCreating(key)}>이 주 계획 만들기</button>
                  </div>
                );
              })}
            </div>
          </section>
          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-600">다른 주</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {others.map((p) => (
                  <WeeklyPlanCard key={p._id} plan={p} {...actions(p)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {editing && (
        <Modal title={`${dateKeyFromStored(editing.weekStart)} 주 계획 수정`} onClose={() => setEditing(null)}>
          <WeeklyPlanForm
            plan={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await updatePlan(editing._id, values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
      {creating && (
        <Modal title="새 주간 계획" onClose={() => setCreating(null)}>
          <WeeklyPlanForm
            defaultWeekStart={creating}
            onCancel={() => setCreating(null)}
            onSubmit={async (values) => {
              const plan = await addPlan(values);
              setCreating(null);
              router.push(`/weekly/${plan._id}`);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
