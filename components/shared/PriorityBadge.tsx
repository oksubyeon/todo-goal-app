import Badge from './Badge';
import { PRIORITY_LABEL, type Priority } from '@/types';

const COLORS: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={COLORS[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
