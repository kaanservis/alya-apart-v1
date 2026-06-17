import { useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { canViewPrices as resolveCanViewPrices, formatMoneyByPermission } from './formatMoney'

export function useCanViewPrices() {
  const { user } = useAuth()
  return useMemo(() => resolveCanViewPrices(user), [user])
}

export function useFormatAdminCurrency() {
  const canView = useCanViewPrices()

  return useCallback((value: number) => formatMoneyByPermission(value, canView), [canView])
}
