import { getTurkeyDateKey } from '../lib/turkeyDate'
import type { Reservation } from '../types/database'

export type ReservationTimelineStatus = 'Aktif' | 'Gelecek' | 'Geçmiş'

export interface ReservationDisplayStatus {
  label: string
  timeline: ReservationTimelineStatus | 'İptal' | 'No Show'
}

export function getReservationDisplayStatus(
  reservation: Pick<Reservation, 'giris_tarihi' | 'cikis_tarihi' | 'durum'>,
  today = getTurkeyDateKey(),
): ReservationDisplayStatus {
  if (reservation.durum === 'İptal') {
    return { label: 'İptal', timeline: 'İptal' }
  }

  if (reservation.durum === 'No Show') {
    return { label: 'No Show', timeline: 'No Show' }
  }

  if (reservation.durum === 'Geçmiş' || reservation.cikis_tarihi < today) {
    return { label: 'Geçmiş', timeline: 'Geçmiş' }
  }

  if (reservation.giris_tarihi > today) {
    return { label: 'Gelecek', timeline: 'Gelecek' }
  }

  return { label: 'Aktif', timeline: 'Aktif' }
}

const BADGE_STYLES: Record<ReservationDisplayStatus['timeline'], string> = {
  Aktif: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  Gelecek: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  Geçmiş: 'bg-slate-200 text-slate-700 ring-1 ring-slate-300',
  İptal: 'bg-zinc-200 text-zinc-800 ring-1 ring-zinc-300',
  'No Show': 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
}

const BADGE_ICONS: Partial<Record<ReservationDisplayStatus['timeline'], string>> = {
  Aktif: '🟢',
  Gelecek: '🔵',
  Geçmiş: '⚫',
}

interface ReservationTimelineBadgeProps {
  reservation: Pick<Reservation, 'giris_tarihi' | 'cikis_tarihi' | 'durum'>
}

export function ReservationTimelineBadge({ reservation }: ReservationTimelineBadgeProps) {
  const status = getReservationDisplayStatus(reservation)
  const icon = BADGE_ICONS[status.timeline]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_STYLES[status.timeline]}`}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {status.label}
    </span>
  )
}
