import {
  formatTurkeyInstant,
  getSeasonDateRange,
  getTurkeyDateKey,
  getTurkeyMonthDateRange,
} from '../lib/turkeyDate'
import { formatMoneyByPermission, formatPdfMoneyByPermission } from '../auth/formatMoney'
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

export function calculateExpenseTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + Number(expense.tutar), 0)
}

export function formatCurrency(value: number, canViewPrices = true) {
  return formatMoneyByPermission(value, canViewPrices)
}

export function formatExpensePdfCurrency(value: number, canViewPrices = true) {
  return formatPdfMoneyByPermission(value, canViewPrices)
}

export function formatExpenseShortDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}`
}

export function formatExpenseReportTimestamp(date = new Date()) {
  return formatTurkeyInstant(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string) {
  return formatExpenseShortDate(value)
}

export function parseAmount(value: string): number {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function validateExpenseForm(values: {
  aciklama: string
  tutar: string
}) {
  const errors: Record<string, string> = {}

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
