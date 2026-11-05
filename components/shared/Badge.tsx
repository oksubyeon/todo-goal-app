export default function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${className || 'bg-slate-100 text-slate-600'}`}>
      {children}
    </span>
  );
}
