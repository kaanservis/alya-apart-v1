import { useState } from 'react'
import { sanitizePriceInput } from '../reservations/formInputHelpers'
import { createExpense } from './expenseService'
import { hasFormErrors, validateExpenseForm } from './expenseCalculations'
import type { ExpenseFormErrors, ExpenseFormValues } from './types'
import { EMPTY_EXPENSE_FORM } from './types'

interface ExpenseInlineFormProps {
  onSaved: () => void
}

export function ExpenseInlineForm({ onSaved }: ExpenseInlineFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_EXPENSE_FORM)
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const nextErrors = validateExpenseForm(values)
    setErrors(nextErrors)

    if (hasFormErrors(nextErrors)) {
      return
    }

    setSubmitting(true)

    try {
      await createExpense(values)
      setValues(EMPTY_EXPENSE_FORM)
      setErrors({})
      onSaved()
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Masraf kaydedilemedi.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      {errors.submit && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errors.submit}
        </div>
      )}

      <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Tutar (₺)</span>
          <input
            type="text"
            inputMode="decimal"
            value={values.tutar}
            onChange={(event) => {
              setValues((current) => ({ ...current, tutar: sanitizePriceInput(event.target.value) }))
              setErrors((current) => {
                const next = { ...current }
                delete next.tutar
                delete next.submit
                return next
              })
            }}
            placeholder="0"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-600 focus:border-blue-400 focus:ring-2"
          />
          {errors.tutar && <span className="mt-1 block text-xs text-red-600">{errors.tutar}</span>}
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Masraf Açıklaması</span>
          <textarea
            value={values.aciklama}
            rows={3}
            onChange={(event) => {
              setValues((current) => ({ ...current, aciklama: event.target.value }))
              setErrors((current) => {
                const next = { ...current }
                delete next.aciklama
                delete next.submit
                return next
              })
            }}
            placeholder="Örn. Elektrik faturası, market alışverişi..."
            className="min-h-[72px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-600 focus:border-blue-400 focus:ring-2"
          />
          {errors.aciklama && (
            <span className="mt-1 block text-xs text-red-600">{errors.aciklama}</span>
          )}
        </label>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 min-w-[140px] max-w-[180px] items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm shadow-blue-700/25 transition hover:bg-blue-800 disabled:opacity-60"
        >
          <span aria-hidden>💾</span>
          {submitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
