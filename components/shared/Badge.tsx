import Icon, { type IconName } from './Icon';

/** neutral: 기본 메타 정보 · quiet: 덜 중요한 정보 · brand: 강조(아껴 쓰기) · outline: 흰 바탕 알약 */
type Tone = 'neutral' | 'quiet' | 'brand' | 'outline';

const TONE: Record<Tone, string> = {
  neutral: 'badge-neutral',
  quiet: 'badge-quiet',
  brand: 'badge-brand',
  outline: 'badge-outline',
};

export default function Badge({ children, tone = 'neutral', icon }: { children: React.ReactNode; tone?: Tone; icon?: IconName }) {
  return (
    <span className={TONE[tone]}>
      {icon && <Icon name={icon} className="h-3 w-3" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
