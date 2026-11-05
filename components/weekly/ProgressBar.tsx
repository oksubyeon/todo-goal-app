export default function ProgressBar({
  value,
  label,
  detail,
}: {
  value: number;
  label?: string;
  detail?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || detail) && (
        <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>
            <span className="font-semibold text-slate-800" data-testid="progress-value">{v}%</span>
            {detail && <span className="ml-1">{detail}</span>}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
