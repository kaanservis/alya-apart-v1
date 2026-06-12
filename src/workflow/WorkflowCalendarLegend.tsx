interface WorkflowCalendarLegendProps {
  show?: boolean
}

export function WorkflowCalendarLegend({ show = true }: WorkflowCalendarLegendProps) {
  if (!show) {
    return null
  }

  const items = [
    { color: 'bg-blue-500', label: 'Boş / Müsait' },
    { color: 'bg-rose-500', label: 'Dolu' },
    { color: 'bg-amber-500', label: 'Çıkış Bekliyor' },
    { color: 'bg-orange-500', label: 'Temizlik Bekliyor' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-700">Sezon renkleri</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${item.color}`} />
          <span className="text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
