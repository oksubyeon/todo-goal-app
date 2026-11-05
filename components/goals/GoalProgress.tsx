'use client';

import ProgressBar from '@/components/weekly/ProgressBar';
import { useProgress } from '@/store';

/** 연결된 할 일 기준 목표 진행률. 스토어에서 계산하므로 할 일 상태가 바뀌면 바로 반영됩니다. */
export default function GoalProgress({ goalId }: { goalId: string }) {
  const p = useProgress('goalId', goalId);
  return <ProgressBar value={p.percent} label="진행률" detail={`(${p.done}/${p.total})`} />;
}
