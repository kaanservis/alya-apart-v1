import { useEffect, useState } from 'react'
import type { PaymentRecord, Reservation } from '../types/database'
import { PaymentBreakdown } from '../components/PaymentBreakdown'
import { formatReservationDate } from './reservationDisplay'
import { isAccountClosed } from './depositCalculations'
import { sanitizePriceInput } from './formInputHelpers'
import { addTahsilat, fetchTahsilatHistory } from './tahsilatService'
import { parseAmount } from './validation'

function formatTahsilatAmount(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

interface ReservationTahsilatSectionProps {
  reservation: Reservation
  onUpdated?: (reservation: Reservation) => void
}

export function ReservationTahsilatSection({
  reservation: initialReservation,
  onUpdated,
}: ReservationTahsilatSectionProps) {
  const [reservation, setReservation] = useState(initialReservation)
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setReservation((current) => {
      if (
        current.id === initialReservation.id &&
        current.updated_at === initialReservation.updated_at
      ) {
        return current
      }

      return initialReservation
    })
  }, [initialReservation.id, initialReservation.updated_at, initialReservation])

  useEffect(() => {
    async function loadHistory() {
      try {
        const records = await fetchTahsilatHistory(reservation.id)
        setHistory(records)
      } catch {
        setHistory([])
      }
    }

    void loadHistory()
  }, [reservation.id])

  async function handleAddTahsilat(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const parsedAmount = parseAmount(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir tahsilat tutarı giriniz.')
      return
    }

    setLoading(true)

    try {
      const result = await addTahsilat(reservation.id, parsedAmount)
      const records = await fetchTahsilatHistory(reservation.id)
      setReservation(result.reservation)
      setHistory(records)
      setAmount('')
      onUpdated?.(result.reservation)
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Tahsilat eklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const accountClosed = isAccountClosed(reservation)

  return (
    <div className="space-y-5">
      {accountClosed && (
        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
          HESAP KAPANDI
        </span>
      )}

      <PaymentBreakdown reservation={reservation} />

      {!accountClosed && (
        <section className="rounded-xl border border-orange-100 bg-white p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800">Ek Ödeme</h4>
          <form onSubmit={(event) => void handleAddTahsilat(event)} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(sanitizePriceInput(event.target.value))}
              placeholder="0,00"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-orange-500 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? 'Kaydediliyor...' : 'Tahsilat Ekle'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </section>
      )}

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Tahsilat Geçmişi</h4>
        {history.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Henüz tahsilat kaydı yok.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((record) => (
              <li
                key={record.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                {formatReservationDate(record.payment_date)} +{formatTahsilatAmount(record.amount)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
