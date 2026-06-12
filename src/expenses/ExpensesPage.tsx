import { useMemo, useState } from 'react'
import { calculateExpenseStatistics } from './expenseCalculations'
import { ExpenseFormModal } from './ExpenseFormModal'
import { ExpenseListSection } from './ExpenseListSection'
import { ExpenseStatisticsCards } from './ExpenseStatisticsCards'
import type { Expense } from './types'

interface ExpensesPageProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  onUpdated: () => void
}

export function ExpensesPage({ expenses, loading, error, onUpdated }: ExpensesPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const statistics = useMemo(() => calculateExpenseStatistics(expenses), [expenses])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Masraflar yükleniyor...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Masraflar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Masraf kayıtları yalnızca bu sayfada görüntülenir ve yönetilir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Masraf Ekle
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <ExpenseStatisticsCards statistics={statistics} />
      <ExpenseListSection
        expenses={expenses}
        onEdit={setEditingExpense}
        onDeleted={onUpdated}
      />

      {showCreateModal && (
        <ExpenseFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSaved={onUpdated}
        />
      )}

      {editingExpense && (
        <ExpenseFormModal
          mode="edit"
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={onUpdated}
        />
      )}
    </div>
  )
}
