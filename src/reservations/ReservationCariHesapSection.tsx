import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useCanViewPrices, useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import type { PaymentRecord, Reservation } from '../types/database'
import { formatReservationDate } from './reservationDisplay'
import { sanitizePriceInput } from './formInputHelpers'
import { calculateNights } from './pricing'
import { buildPaymentSummary } from './paymentCalculations'
import {
  addPaymentRecord,
  closeRemainingBalance,
  deletePaymentRecord,
  fetchReservationPaymentState,
  type ReservationPaymentState,
} from './tahsilatService'
import { parseAmount } from './validation'

const PAYMENT_NOTE_SUGGESTIONS = [
  'Kapora',
  'Nakit ödeme',
  'Havale',
  'Kredi Kartı',
  'Elden Tahsil',
  'Son Ödeme',
]

interface ReservationCariHesapSectionProps {
  reservation: Reservation
  onUpdated?: (reservation: Reservation) => void
  refreshToken?: number
  sectionTitle?: string
  showTopSummary?: boolean
  showDailyRate?: boolean
}

export function ReservationCariHesapSection({
  reservation: initialReservation,
  onUpdated,
  refreshToken = 0,
  sectionTitle = '💳 Cari Hesap',
  showTopSummary = true,
  showDailyRate = true,
}: ReservationCariHesapSectionProps) {
  const { user, hasPermission } = useAuth()
  const canViewPrices = useCanViewPrices()
  const canEditPayments = hasPermission('can_edit_prices') && canViewPrices
  const formatCurrency = useFormatAdminCurrency()

  const [reservation, setReservation] = useState(initialReservation)
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmCloseBalance, setConfirmCloseBalance] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const [amountInput, setAmountInput] = useState('')
  const [paymentNote, setPaymentNote] = useState('')

  const totalNights = useMemo(
    () => calculateNights(reservation.giris_tarihi, reservation.cikis_tarihi),
    [reservation.giris_tarihi, reservation.cikis_tarihi],
  )
  const dailyRate = useMemo(() => {
    if (reservation.gunluk_ucret != null && reservation.gunluk_ucret > 0) {
      return Number(reservation.gunluk_ucret)
    }

    if (totalNights <= 0) {
      return 0
    }

    return Number(reservation.toplam_ucret) / totalNights
  }, [reservation.gunluk_ucret, reservation.toplam_ucret, totalNights])
  const paymentSummary = useMemo(
    () => buildPaymentSummary(reservation, history),
    [reservation, history],
  )
  const { totalCollected, remainingBalance, isAccountClosed: accountClosed } = paymentSummary

  useEffect(() => {
    setReservation(initialReservation)
  }, [initialReservation])

  useEffect(() => {
    async function loadPaymentState() {
      setLoadingHistory(true)
      setError(null)

      try {
        const state = await fetchReservationPaymentState(reservation.id)
        setReservation(state.reservation)
        setHistory(state.payments)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ödeme geçmişi yüklenemedi.')
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    void loadPaymentState()
  }, [reservation.id, refreshToken])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 3500)
    return () => window.clearTimeout(timer)
  }, [success])

  function applyPaymentState(state: ReservationPaymentState) {
    setReservation(state.reservation)
    setHistory(state.payments)
    onUpdated?.(state.reservation)
  }

  async function handleAddPayment(event: React.FormEvent) {
    event.preventDefault()

    if (!canEditPayments) {
      return
    }

    setError(null)
    const parsedAmount = parseAmount(amountInput)

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir ödeme tutarı giriniz.')
      return
    }

    setSaving(true)

    try {
      const result = await addPaymentRecord(reservation.id, {
        amount: parsedAmount,
        paymentDate: getTurkeyDateKey(),
        note: paymentNote,
        recordedBy: user?.username,
      })

      applyPaymentState(result)
      setAmountInput('')
      setPaymentNote('')
      setShowPaymentForm(false)
      setSuccess('Ödeme kaydedildi.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Ödeme kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseBalance() {
    if (!confirmCloseBalance) {
      setConfirmCloseBalance(true)
      return
    }

    if (!canEditPayments) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const result = await closeRemainingBalance(reservation.id, {
        paymentDate: getTurkeyDateKey(),
        recordedBy: user?.username,
        note: 'Kalan bakiye kapatıldı',
      })

      applyPaymentState(result)
      setConfirmCloseBalance(false)
      setSuccess('Kalan bakiye kapatıldı.')
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Bakiye kapatılamadı.')
      setConfirmCloseBalance(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!canEditPayments) {
      return
    }

    const confirmed = window.confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')
    if (!confirmed) {
      return
    }

    setDeletingId(paymentId)
    setError(null)

    try {
      const updated = await deletePaymentRecord(paymentId, reservation.id)
      applyPaymentState(updated)
      setSuccess('Ödeme kaydı silindi.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Ödeme silinemedi.')
    } finally {
      setDeletingId(null)
    }
  }

  const content = (
    <div className="space-y-5">
      {showTopSummary && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                💰 Toplam Ücret
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatCurrency(Number(reservation.toplam_ucret))}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                💵 Tahsil Edilen
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-800">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-rose-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                💳 Kalan Bakiye
              </p>
              <p className="mt-2 text-2xl font-black text-rose-700">
                {formatCurrency(remainingBalance)}
              </p>
            </div>
          </div>

          <div className="mt-3">
            {remainingBalance > 0 ? (
              <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-800 ring-1 ring-red-200">
                ÖDEME BEKLİYOR
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                BORÇ YOK
              </span>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-orange-900">Cari Hesap</h4>
        <dl className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2">
          {showDailyRate && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Günlük Ücret
              </dt>
              <dd className="font-semibold text-slate-900">{formatCurrency(dailyRate)}</dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Toplam Ücret
            </dt>
            <dd className="font-semibold text-slate-900">
              {formatCurrency(Number(reservation.toplam_ucret))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Tahsil Edilen
            </dt>
            <dd className="font-semibold text-emerald-800">{formatCurrency(totalCollected)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Kalan Bakiye
            </dt>
            <dd className="font-black text-red-600">{formatCurrency(remainingBalance)}</dd>
          </div>
        </dl>
      </section>

      {canEditPayments && remainingBalance > 0 && !showPaymentForm && (
        <button
          type="button"
          onClick={() => setShowPaymentForm(true)}
          className={`${adminActionBtnPrimary} w-full justify-center sm:w-auto`}
        >
          ➕ Ödeme Ekle
        </button>
      )}

      {canEditPayments && remainingBalance > 0 && showPaymentForm && (
        <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-blue-900">Ödeme Ekle</h4>
          <form onSubmit={(event) => void handleAddPayment(event)} className="mt-3 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Ödeme Tutarı (₺)</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => setAmountInput(sanitizePriceInput(event.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none ring-blue-600 focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Açıklama (isteğe bağlı)</span>
              <input
                type="text"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Örn. Kapora, Havale, Nakit ödeme"
                list="payment-note-suggestions"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none ring-blue-600 focus:ring-2"
              />
              <datalist id="payment-note-suggestions">
                {PAYMENT_NOTE_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className={adminActionBtnPrimary}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowPaymentForm(false)
                  setAmountInput('')
                  setPaymentNote('')
                }}
                className={adminActionBtnSecondary}
              >
                Vazgeç
              </button>
            </div>
          </form>
        </section>
      )}

      {canEditPayments && remainingBalance > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          {confirmCloseBalance && (
            <p className="mb-3 text-sm font-medium text-amber-900">
              Kalan bakiye ({formatCurrency(remainingBalance)}) tek seferde ödenerek hesap kapatılacak.
              Onaylıyor musunuz?
            </p>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleCloseBalance()}
            className={`${confirmCloseBalance ? adminActionBtnDanger : adminActionBtnSecondary} disabled:opacity-60`}
          >
            {saving
              ? 'İşleniyor...'
              : confirmCloseBalance
                ? 'Evet, Kalan Bakiyeyi Kapat'
                : 'Kalan Bakiyeyi Kapat'}
          </button>
          {confirmCloseBalance && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfirmCloseBalance(false)}
              className={`${adminActionBtnSecondary} ml-2 disabled:opacity-60`}
            >
              Vazgeç
            </button>
          )}
        </div>
      )}

      {accountClosed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          ✓ Cari hesap kapalı — kalan bakiye {formatCurrency(0)}
        </div>
      )}

      <section>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">📒 Ödeme Geçmişi</h4>
        {loadingHistory ? (
          <p className="mt-3 text-sm text-slate-600">Ödemeler yükleniyor...</p>
        ) : history.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Henüz ödeme kaydı yok.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Açıklama</th>
                  <th className="px-4 py-3">İşlemi Yapan</th>
                  {canEditPayments && <th className="px-4 py-3 text-right">Sil</th>}
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatReservationDate(record.payment_date)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-800">
                      {formatCurrency(Number(record.amount))}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{record.note?.trim() || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{record.recorded_by?.trim() || '—'}</td>
                    {canEditPayments && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === record.id}
                          onClick={() => void handleDeletePayment(record.id)}
                          className={`${adminActionBtnDanger} disabled:opacity-60`}
                        >
                          {deletingId === record.id ? '...' : 'Sil'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )

  if (sectionTitle) {
    return (
      <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-900">{sectionTitle}</h3>
        <div className="mt-4">{content}</div>
      </section>
    )
  }

  return content
}
