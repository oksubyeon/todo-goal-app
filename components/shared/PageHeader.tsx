/** 모든 화면의 제목 영역: 제목(28px/700) + 설명 + 오른쪽 동작 버튼 */
export default function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        {back}
        <h1 className="text-[28px] font-bold leading-tight text-fg">{title}</h1>
        {description && <p className="text-base text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
