import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Expense } from './types'

export function useExpenses(refreshToken: number) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadExpenses() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setExpenses([])
        setError('Supabase bağlantısı yapılandırılmadı. Masraf kaydetmek için .env dosyasını yapılandırın.')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('tarih', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        setExpenses([])
        setLoading(false)
        return
      }

      setExpenses((data ?? []) as Expense[])
      setError(null)
      setLoading(false)
    }

    void loadExpenses()
  }, [refreshToken])

  return { expenses, loading, error }
}
