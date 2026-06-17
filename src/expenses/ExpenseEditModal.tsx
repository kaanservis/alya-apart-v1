import { useEffect, useState } from 'react'
import { adminActionBtnPrimary, adminActionBtnSecondary } from '../components/admin/adminMobileStyles'
import { sanitizePriceInput } from '../reservations/formInputHelpers'
import { updateExpense } from './expenseService'
import { formatExpenseShortDate, hasFormErrors, validateExpenseForm } from './expenseCalculations'
import type { Expense, ExpenseFormErrors, ExpenseFormValues } from './types'

interface ExpenseEditModalProps {
  expense: Expense
  onClose: () => void
  onSaved: () => void
}

function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    aciklama: expense.aciklama,
    tutar: String(expense.tutar),
  }
}

export function ExpenseEditModal({ expense, onClose, onSaved }: ExpenseEditModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() => expenseToFormValues(expense))
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(expenseToFormValues(expense))
    setErrors({})
  }, [expense])

  function handleChange(field: keyof ExpenseFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      delete next.submit
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const nextErrors = validateExpenseForm(values)
    setErrors(nextErrors)

    if (hasFormErrors(nextErrors)) {
      return
    }

    setSubmitting(true)

    try {
      await updateExpense(expense.id, values)
      onSaved()
      onClose()
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Masraf güncellenemedi.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-edit-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Masraf Düzenle</p>
            <h3 id="expense-edit-title" className="mt-1 text-xl font-semibold text-slate-900">
              Kayıt Güncelle
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tarih: {formatExpenseShortDate(expense.tarih)} (otomatik)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Masraf Açıklaması</span>
            <input
              type="text"
              value={values.aciklama}
              onChange={(event) => handleChange('aciklama', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
            {errors.aciklama && (
              <span className="mt-1 block text-xs text-red-600">{errors.aciklama}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tutar (₺)</span>
            <input
              type="text"
              inputMode="decimal"
              value={values.tutar}
              onChange={(event) => handleChange('tutar', sanitizePriceInput(event.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
            {errors.tutar && <span className="mt-1 block text-xs text-red-600">{errors.tutar}</span>}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={adminActionBtnSecondary}>
              İptal
            </button>
            <button type="submit" disabled={submitting} className={`${adminActionBtnPrimary} disabled:opacity-60`}>
              {submitting ? 'Kaydediliyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
