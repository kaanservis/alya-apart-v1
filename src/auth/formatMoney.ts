export const MASKED_MONEY_LABEL = '**** TL'

export function formatAdminCurrency(value: number, canViewPrices: boolean) {
  if (!canViewPrices) {
    return MASKED_MONEY_LABEL
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function maskTcNumber(value: string | null | undefined, canViewTc: boolean) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return '—'
  }

  if (canViewTc) {
    return trimmed
  }

  return '***********'
}
