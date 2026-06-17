import { getTurkeyDateKey } from '../lib/turkeyDate'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Expense } from './types'
import { parseAmount } from './expenseCalculations'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

function buildExpensePayload(values: { aciklama: string; tutar: string }) {
  const tutar = parseAmount(values.tutar)

  if (Number.isNaN(tutar) || tutar <= 0) {
    throw new Error('Geçerli bir tutar giriniz.')
  }

  return {
    aciklama: values.aciklama.trim(),
    tutar,
  }
}

export async function createExpense(values: {
  aciklama: string
  tutar: string
}): Promise<Expense> {
  const client = assertSupabaseClient()
  const payload = {
    ...buildExpensePayload(values),
    tarih: getTurkeyDateKey(),
  }

  const { data, error } = await client
    .from('expenses')
    .insert(payload as never)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Expense
}

export async function updateExpense(
  expenseId: string,
  values: { aciklama: string; tutar: string },
): Promise<Expense> {
  const client = assertSupabaseClient()
  const payload = buildExpensePayload(values)

  const { data, error } = await client
    .from('expenses')
    .update(payload as never)
    .eq('id', expenseId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Expense
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client.from('expenses').delete().eq('id', expenseId)

  if (error) {
    throw new Error(error.message)
  }
}
