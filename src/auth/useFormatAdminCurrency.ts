import { useCallback } from 'react'
import { useAuth } from './AuthContext'
import { formatAdminCurrency } from './formatMoney'

export function useFormatAdminCurrency() {
  const { hasPermission } = useAuth()
  const canViewPrices = hasPermission('can_view_prices')

  return useCallback(
    (value: number) => formatAdminCurrency(value, canViewPrices),
    [canViewPrices],
  )
}
