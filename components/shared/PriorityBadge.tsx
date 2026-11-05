import Badge from './Badge';
import { PRIORITY_LABEL, type Priority } from '@/types';

const TONE = { high: 'red', medium: 'amber', low: 'green' } as const;

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
