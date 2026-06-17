import { hasPermission } from './permissions'
import type { AdminUser } from './types'

export const MASKED_MONEY_LABEL = '****'
export const MASKED_TC_LABEL = '***********'

const tryCurrencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

export function canViewPrices(user: AdminUser | null | undefined): boolean {
  return hasPermission(user, 'can_view_prices')
}

export function formatMoneyByPermission(value: number, canView: boolean): string {
  if (!canView) {
    return MASKED_MONEY_LABEL
  }

  return tryCurrencyFormatter.format(value)
}

/** @deprecated Use formatMoneyByPermission */
export function formatAdminCurrency(value: number, canView: boolean): string {
  return formatMoneyByPermission(value, canView)
}

export function formatPdfMoneyByPermission(value: number, canView: boolean): string {
  if (!canView) {
    return MASKED_MONEY_LABEL
  }

  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

  return formatted.replace(/\s?TL\b/u, '₺').replace(/\u00A0/g, ' ')
}

export function formatMoneyExport(value: number, canView = true): string {
  return formatMoneyByPermission(value, canView)
}

export function maskMoneyLabel(canView: boolean, visibleLabel: string): string {
  return canView ? visibleLabel : MASKED_MONEY_LABEL
}

export function maskTcNumber(value: string | null | undefined, canView: boolean): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return '—'
  }

  return canView ? trimmed : MASKED_TC_LABEL
}
