import type { CashSummary } from './types'
import { formatCurrency } from './cashCalculations'

interface CashSummaryCardsProps {
  summary: CashSummary
}

const cards = [
  {
    key: 'toplamTahsilEdilecek' as const,
    label: 'Toplam Tahsil Edilecek',
    className: 'border-blue-200 bg-blue-50 text-blue-950',
  },
  {
    key: 'toplamTahsilEdilen' as const,
    label: 'Toplam Tahsil Edilen',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  {
    key: 'toplamKalanBakiye' as const,
    label: 'Toplam Kalan Bakiye',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
  },
]

export function CashSummaryCards({ summary }: CashSummaryCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.key} className={`rounded-2xl border p-5 shadow-sm ${card.className}`}>
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(summary[card.key])}</p>
        </div>
      ))}
    </section>
  )
}
