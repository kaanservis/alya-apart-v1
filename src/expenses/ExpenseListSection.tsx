import { useState } from 'react'
import type { Expense } from './types'
import { deleteExpense } from './expenseService'
import { formatCurrency, formatDate } from './expenseCalculations'

interface ExpenseListSectionProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDeleted: () => void
}

export function ExpenseListSection({ expenses, onEdit, onDeleted }: ExpenseListSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Masraf Kayıtları</h2>
        <p className="mt-1 text-sm text-slate-500">Tüm masraf kayıtlarını görüntüleyin ve yönetin.</p>
      </div>

      {actionError && (
        <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">Henüz masraf kaydı bulunmuyor.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">Açıklama</th>
                <th className="px-4 py-3 font-semibold">Tutar</th>
                <th className="px-4 py-3 font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-slate-700">{formatDate(expense.tarih)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{expense.aciklama}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(Number(expense.tutar))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={processingId === expense.id}
                        onClick={() => handleDelete(expense.id)}
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
          </table>
        </div>
      )}
    </section>
  )
}
