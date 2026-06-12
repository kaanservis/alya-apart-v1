import {
  formatTurkeyDateKey,
  getSeasonDateRange,
  getTurkeyDateKey,
  getTurkeyMonthDateRange,
} from '../lib/turkeyDate'
import type { Expense, ExpenseStatistics } from './types'

function sumExpensesInRange(expenses: Expense[], start: string, end: string): number {
  return expenses
    .filter((expense) => expense.tarih >= start && expense.tarih <= end)
    .reduce((total, expense) => total + Number(expense.tutar), 0)
}

export function calculateExpenseStatistics(
  expenses: Expense[],
  reference = new Date(),
): ExpenseStatistics {
  const todayKey = getTurkeyDateKey(reference)
  const monthBounds = getTurkeyMonthDateRange(reference)
  const year = Number(todayKey.slice(0, 4))
  const seasonBounds = getSeasonDateRange(year)

  return {
    todayTotal: sumExpensesInRange(expenses, todayKey, todayKey),
    monthTotal: sumExpensesInRange(expenses, monthBounds.start, monthBounds.end),
    seasonTotal: sumExpensesInRange(expenses, seasonBounds.start, seasonBounds.end),
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return formatTurkeyDateKey(value)
}

export function parseAmount(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : NaN
}

export function validateExpenseForm(values: {
  tarih: string
  aciklama: string
  tutar: string
}) {
  const errors: Record<string, string> = {}

  if (!values.tarih) {
    errors.tarih = 'Tarih zorunludur.'
  }

  if (!values.aciklama.trim()) {
    errors.aciklama = 'Açıklama zorunludur.'
  }

  const tutar = parseAmount(values.tutar)
  if (Number.isNaN(tutar) || tutar <= 0) {
    errors.tutar = 'Geçerli bir tutar giriniz.'
  }

  return errors
}

export function hasFormErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0
}
