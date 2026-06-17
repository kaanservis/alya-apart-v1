export interface Expense {
  id: string
  tarih: string
  aciklama: string
  tutar: number
  created_at: string
  updated_at: string
}

export interface ExpenseFormValues {
  aciklama: string
  tutar: string
}

export interface ExpenseFormErrors {
  aciklama?: string
  tutar?: string
  submit?: string
}

export interface ExpenseStatistics {
  todayTotal: number
  monthTotal: number
  seasonTotal: number
}

export const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  aciklama: '',
  tutar: '',
}
