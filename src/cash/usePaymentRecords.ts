import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { PaymentRecord } from './types'

export function usePaymentRecords(refreshToken: number) {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPaymentRecords() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setPaymentRecords([])
        setError(null)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('payment_records')
        .select('*')
        .order('payment_date', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        setPaymentRecords([])
        setLoading(false)
        return
      }

      setPaymentRecords((data ?? []) as PaymentRecord[])
      setError(null)
      setLoading(false)
    }

    void loadPaymentRecords()
  }, [refreshToken])

  return { paymentRecords, loading, error }
}
