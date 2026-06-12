interface ReportBarChartProps {
  title: string
  points: { label: string; value: number }[]
  colorClass: string
  formatValue?: (value: number) => string
}

export function ReportBarChart({
  title,
  points,
  colorClass,
  formatValue = (value) => String(value),
}: ReportBarChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-4 text-sm text-slate-500">Bu dönem için veri yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-5 space-y-4">
        {points.map((point) => (
          <div key={point.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">{point.label}</span>
              <span className="font-semibold text-slate-900">{formatValue(point.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${Math.max(4, (point.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
