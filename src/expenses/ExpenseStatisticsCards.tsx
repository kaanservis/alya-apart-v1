import type { ExpenseStatistics } from './types'
import { useAuth } from '../auth/AuthContext'
import { formatCurrency } from './expenseCalculations'

interface ExpenseStatisticsCardsProps {
  statistics: ExpenseStatistics
}

const cards = [
  { key: 'todayTotal' as const, label: 'Bugünkü Masraflar' },
  { key: 'monthTotal' as const, label: 'Aylık Masraflar' },
  { key: 'seasonTotal' as const, label: 'Sezon Masrafları' },
]

export function ExpenseStatisticsCards({ statistics }: ExpenseStatisticsCardsProps) {
  const { hasPermission } = useAuth()
  const canViewPrices = hasPermission('can_view_prices')

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatCurrency(statistics[card.key], canViewPrices)}
          </p>
        </div>
      ))}
    </section>
  )
}
