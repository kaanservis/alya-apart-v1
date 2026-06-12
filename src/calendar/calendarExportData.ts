import type { AccommodationUnit, Reservation } from '../types/database'
import { toDateKey } from '../calendar/dateUtils'
import { getUnitDisplayOrder } from '../lib/unitOrder'
import { formatReservationDate } from '../reservations/reservationDisplay'
import {
  exportRowsToExcel,
  exportRowsToPdf,
  formatMoneyExport,
  type ExportColumn,
  type ExportRow,
} from '../lib/exportData'

interface CalendarExportEntry {
  unitName: string
  reservation: Reservation
  visibleFrom: string
  visibleTo: string
}

export function buildCalendarExportEntries(
  units: AccommodationUnit[],
  reservations: Reservation[],
  visibleDates: Date[],
): CalendarExportEntry[] {
  if (visibleDates.length === 0) {
    return []
  }

  const rangeStart = toDateKey(visibleDates[0])
  const rangeEnd = toDateKey(visibleDates[visibleDates.length - 1])
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const unitOrderMap = new Map(units.map((unit) => [unit.id, getUnitDisplayOrder(unit)]))

  return reservations
    .filter(
      (reservation) =>
        reservation.durum === 'Aktif' &&
        reservation.giris_tarihi <= rangeEnd &&
        reservation.cikis_tarihi >= rangeStart,
    )
    .map((reservation) => ({
      unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
      reservation,
      visibleFrom:
        reservation.giris_tarihi < rangeStart ? rangeStart : reservation.giris_tarihi,
      visibleTo: reservation.cikis_tarihi > rangeEnd ? rangeEnd : reservation.cikis_tarihi,
    }))
    .sort(
      (a, b) =>
        (unitOrderMap.get(a.reservation.konaklama_birimi_id) ?? 9999) -
        (unitOrderMap.get(b.reservation.konaklama_birimi_id) ?? 9999),
    )
}

const CALENDAR_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Oda', key: 'oda' },
  { header: 'Misafir', key: 'misafir' },
  { header: 'Telefon', key: 'telefon' },
  { header: 'Görünür Giriş', key: 'giris' },
  { header: 'Görünür Çıkış', key: 'cikis' },
  { header: 'Toplam Ücret', key: 'toplam' },
  { header: 'Durum', key: 'durum' },
]

function toCalendarRows(entries: CalendarExportEntry[]): ExportRow[] {
  return entries.map(({ unitName, reservation, visibleFrom, visibleTo }) => ({
    oda: unitName,
    misafir: reservation.ad_soyad,
    telefon: reservation.telefon,
    giris: formatReservationDate(visibleFrom),
    cikis: formatReservationDate(visibleTo),
    toplam: formatMoneyExport(reservation.toplam_ucret),
    durum: reservation.durum,
  }))
}

export function exportCalendarExcel(entries: CalendarExportEntry[], periodLabel: string) {
  exportRowsToExcel(`takvim-${periodLabel.replace(/\s+/g, '-')}`, CALENDAR_EXPORT_COLUMNS, toCalendarRows(entries))
}

export function exportCalendarPdf(entries: CalendarExportEntry[], periodLabel: string) {
  exportRowsToPdf(
    `takvim-${periodLabel.replace(/\s+/g, '-')}`,
    `Rezervasyon Takvimi — ${periodLabel}`,
    CALENDAR_EXPORT_COLUMNS,
    toCalendarRows(entries),
  )
}
