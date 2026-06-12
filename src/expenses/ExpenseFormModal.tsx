import { useEffect, useState } from 'react'
import type { Expense, ExpenseFormErrors, ExpenseFormValues } from './types'
import { EMPTY_EXPENSE_FORM } from './types'
import { createExpense, updateExpense } from './expenseService'
import { hasFormErrors, validateExpenseForm } from './expenseCalculations'

interface ExpenseFormModalProps {
  mode: 'create' | 'edit'
  expense?: Expense
  onClose: () => void
  onSaved: () => void
}

function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    tarih: expense.tarih,
    aciklama: expense.aciklama,
    tutar: String(expense.tutar),
  }
}

export function ExpenseFormModal({ mode, expense, onClose, onSaved }: ExpenseFormModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(
    expense ? expenseToFormValues(expense) : EMPTY_EXPENSE_FORM,
  )
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(expense ? expenseToFormValues(expense) : EMPTY_EXPENSE_FORM)
    setErrors({})
  }, [expense, mode])

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
      if (mode === 'edit' && expense) {
        await updateExpense(expense.id, values)
      } else {
        await createExpense(values)
      }

      onSaved()
      onClose()
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Masraf kaydedilemedi.',
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
        aria-labelledby="expense-form-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {mode === 'create' ? 'Yeni Masraf' : 'Masraf Düzenle'}
            </p>
            <h3 id="expense-form-title" className="mt-1 text-xl font-semibold text-slate-900">
              {mode === 'create' ? 'Masraf Ekle' : 'Masraf Güncelle'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tarih</span>
            <input
              type="date"
              value={values.tarih}
              onChange={(event) => handleChange('tarih', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
            {errors.tarih && <span className="mt-1 block text-xs text-red-600">{errors.tarih}</span>}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Açıklama</span>
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
            <span className="mb-1 block font-medium text-slate-700">Tutar</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={values.tutar}
              onChange={(event) => handleChange('tutar', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
            />
            {errors.tutar && <span className="mt-1 block text-xs text-red-600">{errors.tutar}</span>}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Kaydediliyor...' : mode === 'create' ? 'Ekle' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
