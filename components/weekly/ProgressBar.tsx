export default function ProgressBar({
  value,
  label,
  detail,
}: {
  value: number;
  label?: React.ReactNode;
  detail?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || detail) && (
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm text-muted">
          <span className="min-w-0 truncate">{label}</span>
          <span className="shrink-0 tabular-nums">
            <span className="font-semibold text-fg" data-testid="progress-value">{v}%</span>
            {detail && <span className="ml-1">{detail}</span>}
          </span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-strong" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
