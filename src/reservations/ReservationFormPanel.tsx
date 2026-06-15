import { useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import type { AccommodationUnit, Reservation } from '../types/database'
import { applyReservationFieldChange, buildNewReservationFormValues, reservationToFormValues } from './formState'
import {
  formatPhoneDisplay,
  normalizePhoneDigits,
  sanitizePriceInput,
  toTurkishUppercase,
} from './formInputHelpers'
import { calculateNights } from './pricing'
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from './reservationService'
import {
  type PricingSource,
  type ReservationFormErrors,
  type ReservationFormValues,
} from './types'
import {
  calculateRemainingBalance,
  getAvailableUnits,
  hasFormErrors,
  parseAmount,
  validateReservationForm,
} from './validation'

export interface ReservationFormPanelProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onSaved: () => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
  editReservation?: Reservation
  initialUnitId?: string
  initialCheckIn?: string
  initialCheckOut?: string
}

interface FormSectionProps {
  title: string
  accent: 'blue' | 'green' | 'orange'
  children: ReactNode
}

const sectionStyles = {
  blue: {
    wrapper: 'border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50',
    border: 'border-l-blue-600',
    title: 'text-blue-800',
  },
  green: {
    wrapper: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/50',
    border: 'border-l-emerald-600',
    title: 'text-emerald-800',
  },
  orange: {
    wrapper: 'border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/50',
    border: 'border-l-orange-500',
    title: 'text-orange-800',
  },
}

function FormSection({ title, accent, children }: FormSectionProps) {
  const styles = sectionStyles[accent]

  return (
    <div
      className={`rounded-2xl border p-6 sm:p-8 ${styles.wrapper} border-l-4 ${styles.border} shadow-sm`}
    >
      <h3
        className={`mb-6 text-sm font-bold uppercase tracking-[0.15em] ${styles.title}`}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string
  accent: 'blue' | 'orange' | 'slate'
}

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  const accentStyles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900 ring-blue-100',
    orange: 'border-orange-200 bg-orange-50 text-orange-950 ring-orange-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-900 ring-slate-100',
  }

  return (
    <div
      className={`rounded-2xl border px-5 py-5 ring-1 sm:px-6 sm:py-6 ${accentStyles[accent]}`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
    </div>
  )
}

const fieldClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none ring-blue-600 focus:ring-2'

export function ReservationFormPanel({
  units,
  reservations,
  onSaved,
  onCancel,
  mode = 'create',
  editReservation,
  initialUnitId,
  initialCheckIn,
  initialCheckOut,
}: ReservationFormPanelProps) {
  const { hasPermission } = useAuth()
  const formatCurrency = useFormatAdminCurrency()
  const canChangeDates = hasPermission('can_change_dates')
  const canEditPrices = hasPermission('can_edit_prices')
  const canDeleteReservations = hasPermission('can_delete_reservations')

  const initialValues = useMemo(() => {
    if (mode === 'edit' && editReservation) {
      return reservationToFormValues(editReservation)
    }

    return buildNewReservationFormValues({
      unitId: initialUnitId,
      checkIn: initialCheckIn,
      checkOut: initialCheckOut,
    })
  }, [mode, editReservation, initialUnitId, initialCheckIn, initialCheckOut])

  const [values, setValues] = useState<ReservationFormValues>(initialValues)
  const [pricingSource, setPricingSource] = useState<PricingSource>(
    mode === 'edit' ? 'daily' : null,
  )
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const nights = useMemo(
    () => calculateNights(values.giris_tarihi, values.cikis_tarihi),
    [values.giris_tarihi, values.cikis_tarihi],
  )

  const datesValid =
    Boolean(values.giris_tarihi) &&
    Boolean(values.cikis_tarihi) &&
    values.cikis_tarihi >= values.giris_tarihi

  const availableUnits = useMemo(() => {
    if (!datesValid) {
      return []
    }

    return getAvailableUnits(
      units,
      reservations,
      values.giris_tarihi,
      values.cikis_tarihi,
      mode === 'edit' ? editReservation?.id : undefined,
    )
  }, [
    units,
    reservations,
    values.giris_tarihi,
    values.cikis_tarihi,
    datesValid,
    mode,
    editReservation?.id,
  ])

  const totalAmount = useMemo(() => parseAmount(values.toplam_ucret), [values.toplam_ucret])

  const collectedAmount = useMemo(() => {
    const parsed = parseAmount(values.alinan_tutar)
    return Number.isNaN(parsed) ? 0 : parsed
  }, [values.alinan_tutar])

  const remainingBalance = useMemo(() => {
    const toplam = parseAmount(values.toplam_ucret)
    if (Number.isNaN(toplam)) {
      return 0
    }
    return calculateRemainingBalance(toplam, collectedAmount)
  }, [values.toplam_ucret, collectedAmount])

  const showGuestSection = datesValid && Boolean(values.konaklama_birimi_id)
  const showPricingSection = showGuestSection

  function handleChange(field: keyof ReservationFormValues, value: string) {
    const next = applyReservationFieldChange(values, field, value, pricingSource)
    setValues(next.values)
    setPricingSource(next.pricingSource)
    setErrors((current) => {
      const updated = { ...current }
      delete updated[field]
      delete updated.conflict
      delete updated.submit
      return updated
    })
  }

  function handleGuestNameChange(raw: string) {
    handleChange('ad_soyad', toTurkishUppercase(raw))
  }

  function handlePhoneChange(raw: string) {
    handleChange('telefon', normalizePhoneDigits(raw))
  }

  function handlePriceChange(
    field: 'gunluk_ucret' | 'toplam_ucret' | 'alinan_tutar',
    raw: string,
  ) {
    handleChange(field, sanitizePriceInput(raw))
  }

  function handleSelectRoom(unitId: string) {
    handleChange('konaklama_birimi_id', unitId)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateReservationForm(
      values,
      reservations,
      units,
      mode === 'edit' ? editReservation?.id : undefined,
    )
    setErrors(nextErrors)

    if (hasFormErrors(nextErrors)) {
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'edit' && editReservation) {
        await updateReservation(
          editReservation.id,
          values,
          editReservation.konaklama_birimi_id,
        )
      } else {
        await createReservation(values)
      }

      onSaved()
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Rezervasyon kaydedilemedi.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editReservation) {
      return
    }

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)

    try {
      await deleteReservation(editReservation.id, editReservation.konaklama_birimi_id)
      onSaved()
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Rezervasyon silinemedi.',
      })
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const totalDisplay = Number.isNaN(totalAmount) ? '—' : formatCurrency(totalAmount)
  const balanceDisplay = formatCurrency(remainingBalance)
  const nightsDisplay = nights > 0 ? String(nights) : '—'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg ring-1 ring-slate-100 sm:p-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            {mode === 'edit' ? 'Rezervasyon Düzenle' : 'Yeni Rezervasyon'}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {mode === 'edit' ? editReservation?.ad_soyad : 'Rezervasyon Formu'}
          </h2>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {errors.submit && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errors.submit}
          </div>
        )}

        {errors.conflict && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errors.conflict}
          </div>
        )}

        {confirmDelete && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Bu rezervasyonu silmek istediğinizden emin misiniz? Silmeyi onaylamak için tekrar
            tıklayın.
          </div>
        )}

        <FormSection title="Tarih ve Oda Seçimi" accent="blue">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_minmax(180px,240px)]">
            <label className="block text-sm">
              <span className="mb-2 block font-medium text-slate-700">Giriş Tarihi</span>
              <input
                type="date"
                value={values.giris_tarihi}
                readOnly={!canChangeDates}
                onChange={(event) => handleChange('giris_tarihi', event.target.value)}
                className={`${fieldClassName}${!canChangeDates ? ' cursor-not-allowed bg-slate-100' : ''}`}
              />
              {errors.giris_tarihi && (
                <span className="mt-1 block text-xs text-red-600">{errors.giris_tarihi}</span>
              )}
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-medium text-slate-700">Çıkış Tarihi</span>
              <input
                type="date"
                value={values.cikis_tarihi}
                readOnly={!canChangeDates}
                onChange={(event) => handleChange('cikis_tarihi', event.target.value)}
                className={`${fieldClassName}${!canChangeDates ? ' cursor-not-allowed bg-slate-100' : ''}`}
              />
              {errors.cikis_tarihi && (
                <span className="mt-1 block text-xs text-red-600">{errors.cikis_tarihi}</span>
              )}
            </label>

            <SummaryCard label="Gece Sayısı" value={nightsDisplay} accent="blue" />
          </div>

          {datesValid && (
            <div className="mt-8">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-800">Müsait Odalar</p>
                <span className="text-sm text-slate-500">
                  {availableUnits.length} oda müsait
                </span>
              </div>

              {availableUnits.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Seçilen tarihler için müsait oda bulunmuyor.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                  {availableUnits.map((unit) => {
                    const selected = values.konaklama_birimi_id === unit.id

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => handleSelectRoom(unit.id)}
                        className={`rounded-xl border px-3 py-4 text-center text-sm font-bold transition-all ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {unit.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {errors.konaklama_birimi_id && (
                <span className="mt-2 block text-xs text-red-600">
                  {errors.konaklama_birimi_id}
                </span>
              )}
            </div>
          )}
        </FormSection>

        {showGuestSection && (
          <FormSection title="Misafir Bilgileri" accent="green">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2 block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Ad Soyad</span>
                <input
                  type="text"
                  value={values.ad_soyad}
                  onChange={(event) => handleGuestNameChange(event.target.value)}
                  placeholder="Misafir Adı Soyadı"
                  className={`${fieldClassName} uppercase`}
                />
                {errors.ad_soyad && (
                  <span className="mt-1 block text-xs text-red-600">{errors.ad_soyad}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Telefon</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatPhoneDisplay(values.telefon)}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  placeholder="05XX XXX XX XX"
                  className={fieldClassName}
                />
                {errors.telefon && (
                  <span className="mt-1 block text-xs text-red-600">{errors.telefon}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Kişi Sayısı</span>
                <input
                  type="number"
                  min={1}
                  value={values.kisi_sayisi}
                  onChange={(event) => handleChange('kisi_sayisi', event.target.value)}
                  className={fieldClassName}
                />
                {errors.kisi_sayisi && (
                  <span className="mt-1 block text-xs text-red-600">{errors.kisi_sayisi}</span>
                )}
              </label>

              <label className="sm:col-span-2 block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Not</span>
                <textarea
                  rows={3}
                  value={values.notlar}
                  onChange={(event) => handleChange('notlar', event.target.value)}
                  className={fieldClassName}
                />
              </label>
            </div>
          </FormSection>
        )}

        {showPricingSection && (
          <FormSection title="Fiyat ve Ödeme" accent="orange">
            <div className="grid gap-6 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Gecelik Ücret</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.gunluk_ucret}
                  placeholder="0,00"
                  readOnly={!canEditPrices}
                  onChange={(event) => handlePriceChange('gunluk_ucret', event.target.value)}
                  className={`${fieldClassName}${!canEditPrices ? ' cursor-not-allowed bg-slate-100' : ''}`}
                />
                {errors.gunluk_ucret && (
                  <span className="mt-1 block text-xs text-red-600">{errors.gunluk_ucret}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Toplam Ücret</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.toplam_ucret}
                  placeholder="0,00"
                  readOnly={!canEditPrices}
                  onChange={(event) => handlePriceChange('toplam_ucret', event.target.value)}
                  className={`${fieldClassName}${!canEditPrices ? ' cursor-not-allowed bg-slate-100' : ''}`}
                />
                {errors.toplam_ucret && (
                  <span className="mt-1 block text-xs text-red-600">{errors.toplam_ucret}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-700">Alınan Ücret</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.alinan_tutar}
                  placeholder="0,00"
                  readOnly={!canEditPrices}
                  onChange={(event) => handlePriceChange('alinan_tutar', event.target.value)}
                  className={`${fieldClassName}${!canEditPrices ? ' cursor-not-allowed bg-slate-100' : ''}`}
                />
                {errors.alinan_tutar && (
                  <span className="mt-1 block text-xs text-red-600">{errors.alinan_tutar}</span>
                )}
              </label>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Toplam Ücret" value={totalDisplay} accent="orange" />
              <SummaryCard
                label="Alınan Ücret"
                value={formatCurrency(collectedAmount)}
                accent="blue"
              />
              <SummaryCard label="Kalan Bakiye" value={balanceDisplay} accent="slate" />
            </div>
          </FormSection>
        )}

        {showPricingSection && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
            {mode === 'edit' && canDeleteReservations && (
              <button
                type="button"
                disabled={submitting || deleting}
                onClick={handleDelete}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {deleting ? 'Siliniyor...' : confirmDelete ? 'Silmeyi Onayla' : 'Sil'}
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || deleting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-700/25 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              {submitting ? 'Kaydediliyor...' : mode === 'edit' ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
