import Badge from './Badge';
import { PRIORITY_LABEL, type Priority } from '@/types';

// 강조색은 High에만 씁니다. 나머지는 무채색 단계로 구분합니다.
const TONE = { high: 'brand', medium: 'neutral', low: 'quiet' } as const;

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
