import Icon, { type IconName } from './Icon';

type Tone = 'neutral' | 'brand' | 'red' | 'amber' | 'green' | 'sky';

const TONE: Record<Tone, string> = {
  neutral: 'badge-neutral',
  brand: 'badge-brand',
  red: 'badge-red',
  amber: 'badge-amber',
  green: 'badge-green',
  sky: 'badge-sky',
};

export default function Badge({ children, tone = 'neutral', icon }: { children: React.ReactNode; tone?: Tone; icon?: IconName }) {
  return (
    <span className={TONE[tone]}>
      {icon && <Icon name={icon} className="h-3 w-3" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
