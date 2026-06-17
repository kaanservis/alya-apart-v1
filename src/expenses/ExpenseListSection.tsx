import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { adminActionBtnSecondary } from '../components/admin/adminMobileStyles'
import type { Expense } from './types'
import { deleteExpense } from './expenseService'
import {
  calculateExpenseTotal,
  formatCurrency,
  formatExpenseShortDate,
} from './expenseCalculations'

interface ExpenseListSectionProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDeleted: () => void
}

export function ExpenseListSection({ expenses, onEdit, onDeleted }: ExpenseListSectionProps) {
  const { hasPermission } = useAuth()
  const canViewPrices = hasPermission('can_view_prices')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const totalAmount = useMemo(() => calculateExpenseTotal(expenses), [expenses])

  async function handleDelete(expenseId: string) {
    if (confirmDeleteId !== expenseId) {
      setConfirmDeleteId(expenseId)
      return
    }

    setProcessingId(expenseId)
    setActionError(null)

    try {
      await deleteExpense(expenseId)
      setConfirmDeleteId(null)
      onDeleted()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Masraf silinemedi.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">Masraf Kayıtları</h2>
        <p className="mt-0.5 text-xs text-slate-500">En yeni kayıtlar en üstte listelenir.</p>
      </div>

      {actionError && (
        <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">Henüz masraf kaydı bulunmuyor.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Sıra No</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">Masraf Açıklaması</th>
                <th className="px-4 py-3 font-semibold">Tutar</th>
                <th className="px-4 py-3 font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-700">{formatExpenseShortDate(expense.tarih)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{expense.aciklama}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(Number(expense.tutar), canViewPrices)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        className={adminActionBtnSecondary}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={processingId === expense.id}
                        onClick={() => void handleDelete(expense.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 ${
                          confirmDeleteId === expense.id
                            ? 'bg-red-700 hover:bg-red-800'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {processingId === expense.id
                          ? 'Siliniyor...'
                          : confirmDeleteId === expense.id
                            ? 'Silmeyi Onayla'
                            : 'Sil'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-blue-200 bg-blue-50/80">
                <td colSpan={5} className="px-4 py-4 text-right">
                  <span className="text-base font-black uppercase tracking-wide text-slate-900 sm:text-lg">
                    TOPLAM MASRAF:{' '}
                    <span className="text-blue-800">{formatCurrency(totalAmount, canViewPrices)}</span>
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
