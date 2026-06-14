import type { Reservation } from '../types/database'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { formatReservationDate } from '../reservations/reservationDisplay'
import {
  exportRowsToExcel,
  exportRowsToPdf,
  formatMoneyExport,
  type ExportColumn,
  type ExportRow,
} from '../lib/exportData'
import type { CustomerListRow } from './customerListUtils'

const CUSTOMER_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Ad Soyad', key: 'adSoyad' },
  { header: 'Telefon', key: 'telefon' },
  { header: 'Oda', key: 'oda' },
  { header: 'Giriş Tarihi', key: 'giris' },
  { header: 'Çıkış Tarihi', key: 'cikis' },
  { header: 'Toplam Ücret', key: 'toplam' },
  { header: 'Ödenen Tutar', key: 'odenen' },
  { header: 'Kalan Bakiye', key: 'kalan' },
  { header: 'Durum', key: 'durum' },
]

function toExportRows(rows: CustomerListRow[]): ExportRow[] {
  return rows.map(({ reservation, unitName }) => ({
    adSoyad: reservation.ad_soyad,
    telefon: reservation.telefon,
    oda: unitName,
    giris: formatReservationDate(reservation.giris_tarihi),
    cikis: formatReservationDate(reservation.cikis_tarihi),
    toplam: formatMoneyExport(reservation.toplam_ucret),
    odenen: formatMoneyExport(getTotalCollected(reservation)),
    kalan: formatMoneyExport(getRemainingBalance(reservation)),
    durum: reservation.durum,
  }))
}

export function exportCustomerListExcel(rows: CustomerListRow[]) {
  exportRowsToExcel('musteri-listesi', CUSTOMER_EXPORT_COLUMNS, toExportRows(rows))
}

export function exportCustomerListPdf(rows: CustomerListRow[]) {
  exportRowsToPdf(
    'musteri-listesi',
    'Müşteri / Rezervasyon Listesi',
    CUSTOMER_EXPORT_COLUMNS,
    toExportRows(rows),
  )
}

export function exportRoomReservationsExcel(
  roomName: string,
  reservations: Reservation[],
) {
  const columns: ExportColumn[] = [
    { header: 'Ad Soyad', key: 'adSoyad' },
    { header: 'Giriş', key: 'giris' },
    { header: 'Çıkış', key: 'cikis' },
    { header: 'Toplam', key: 'toplam' },
    { header: 'Ödenen', key: 'odenen' },
    { header: 'Kalan', key: 'kalan' },
    { header: 'Durum', key: 'durum' },
  ]

  const rows: ExportRow[] = reservations.map((reservation) => ({
    adSoyad: reservation.ad_soyad,
    giris: formatReservationDate(reservation.giris_tarihi),
    cikis: formatReservationDate(reservation.cikis_tarihi),
    toplam: formatMoneyExport(reservation.toplam_ucret),
    odenen: formatMoneyExport(getTotalCollected(reservation)),
    kalan: formatMoneyExport(getRemainingBalance(reservation)),
    durum: reservation.durum,
  }))

  exportRowsToExcel(`oda-${roomName}-rezervasyonlar`, columns, rows)
}

export function exportRoomReservationsPdf(roomName: string, reservations: Reservation[]) {
  const columns: ExportColumn[] = [
    { header: 'Ad Soyad', key: 'adSoyad' },
    { header: 'Giriş', key: 'giris' },
    { header: 'Çıkış', key: 'cikis' },
    { header: 'Toplam', key: 'toplam' },
    { header: 'Ödenen', key: 'odenen' },
    { header: 'Kalan', key: 'kalan' },
    { header: 'Durum', key: 'durum' },
  ]

  const rows: ExportRow[] = reservations.map((reservation) => ({
    adSoyad: reservation.ad_soyad,
    giris: formatReservationDate(reservation.giris_tarihi),
    cikis: formatReservationDate(reservation.cikis_tarihi),
    toplam: formatMoneyExport(reservation.toplam_ucret),
    odenen: formatMoneyExport(getTotalCollected(reservation)),
    kalan: formatMoneyExport(getRemainingBalance(reservation)),
    durum: reservation.durum,
  }))

  exportRowsToPdf(
    `oda-${roomName}-rezervasyonlar`,
    `${roomName} Oda Rezervasyon Geçmişi`,
    columns,
    rows,
  )
}
