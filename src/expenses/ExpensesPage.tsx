import { useState } from 'react'
import { useCanViewPrices } from '../auth/useFormatAdminCurrency'
import { adminActionBtnSecondary } from '../components/admin/adminMobileStyles'
import { ExpenseEditModal } from './ExpenseEditModal'
import { ExpenseInlineForm } from './ExpenseInlineForm'
import { ExpenseListSection } from './ExpenseListSection'
import { exportExpenseReportPdf } from './expenseReportPdf'
import type { Expense } from './types'

interface ExpensesPageProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  onUpdated: () => void
}

export function ExpensesPage({ expenses, loading, error, onUpdated }: ExpensesPageProps) {
  const canViewPrices = useCanViewPrices()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExportPdf() {
    setExportingPdf(true)
    setExportError(null)

    try {
      await exportExpenseReportPdf(expenses, canViewPrices)
    } catch (exportFailure) {
      setExportError(
        exportFailure instanceof Error ? exportFailure.message : 'PDF oluşturulamadı.',
      )
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
        Masraflar yükleniyor...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Masraflar</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Masraf ekleyin, düzenleyin ve toplam özeti görün.
            </p>
          </div>
          <button
            type="button"
            disabled={exportingPdf}
            onClick={() => void handleExportPdf()}
            className={`${adminActionBtnSecondary} w-full shrink-0 justify-center sm:w-auto disabled:opacity-60`}
          >
            {exportingPdf ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
          </button>
        </div>

        {(error || exportError) && (
          <div className="mt-3 space-y-2">
            {error && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </div>
            )}
            {exportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {exportError}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <ExpenseInlineForm onSaved={onUpdated} />
        </div>
      </section>

      <ExpenseListSection
        expenses={expenses}
        onEdit={setEditingExpense}
        onDeleted={onUpdated}
      />

      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={onUpdated}
        />
      )}
    </div>
  )
}
