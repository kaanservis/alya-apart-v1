import type { PaymentRecord, Reservation } from '../types/database'
import { buildGuestExportFields, fetchGuestEntriesForReservations } from '../guests/guestService'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { fetchPaymentsByReservationIds } from '../reservations/tahsilatService'
import {
  exportRowsToExcel,
  exportRowsToPdf,
  formatMoneyExport,
  type ExportColumn,
  type ExportRow,
} from '../lib/exportData'
import type { CustomerListRow } from './customerListUtils'

const GUEST_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Rezervasyon Sahibi', key: 'rezervasyonSahibi' },
  { header: 'Tüm Konaklayanlar', key: 'konaklayanlar' },
  { header: 'Kişi Sayısı', key: 'kisiSayisi' },
]

const CUSTOMER_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Oda', key: 'oda' },
  ...GUEST_EXPORT_COLUMNS,
  { header: 'Telefon', key: 'telefon' },
  { header: 'Giriş Tarihi', key: 'giris' },
  { header: 'Çıkış Tarihi', key: 'cikis' },
  { header: 'Toplam Ücret', key: 'toplam' },
  { header: 'Tahsil Edilen', key: 'odenen' },
  { header: 'Kalan Bakiye', key: 'kalan' },
  { header: 'Durum', key: 'durum' },
]

const ROOM_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Oda', key: 'oda' },
  ...GUEST_EXPORT_COLUMNS,
  { header: 'Giriş', key: 'giris' },
  { header: 'Çıkış', key: 'cikis' },
  { header: 'Toplam', key: 'toplam' },
  { header: 'Tahsil Edilen', key: 'odenen' },
  { header: 'Kalan', key: 'kalan' },
  { header: 'Durum', key: 'durum' },
]

function buildCustomerExportRow(
  row: CustomerListRow,
  guests: GuestEntryWithPhotos[] = [],
  canViewPrices = true,
  payments: PaymentRecord[] = [],
): ExportRow {
  const guestFields = buildGuestExportFields(row.reservation, guests)

  return {
    oda: row.unitName,
    rezervasyonSahibi: guestFields.rezervasyonSahibi,
    konaklayanlar: guestFields.konaklayanlar,
    kisiSayisi: guestFields.kisiSayisi,
    telefon: row.reservation.telefon,
    giris: formatReservationDate(row.reservation.giris_tarihi),
    cikis: formatReservationDate(row.reservation.cikis_tarihi),
    toplam: formatMoneyExport(row.reservation.toplam_ucret, canViewPrices),
    odenen: formatMoneyExport(getTotalCollected(row.reservation, payments), canViewPrices),
    kalan: formatMoneyExport(getRemainingBalance(row.reservation, payments), canViewPrices),
    durum: row.reservation.durum,
  }
}

function buildRoomExportRow(
  roomName: string,
  reservation: Reservation,
  guests: GuestEntryWithPhotos[] = [],
  canViewPrices = true,
  payments: PaymentRecord[] = [],
): ExportRow {
  const guestFields = buildGuestExportFields(reservation, guests)

  return {
    oda: roomName,
    rezervasyonSahibi: guestFields.rezervasyonSahibi,
    konaklayanlar: guestFields.konaklayanlar,
    kisiSayisi: guestFields.kisiSayisi,
    giris: formatReservationDate(reservation.giris_tarihi),
    cikis: formatReservationDate(reservation.cikis_tarihi),
    toplam: formatMoneyExport(reservation.toplam_ucret, canViewPrices),
    odenen: formatMoneyExport(getTotalCollected(reservation, payments), canViewPrices),
    kalan: formatMoneyExport(getRemainingBalance(reservation, payments), canViewPrices),
    durum: reservation.durum,
  }
}

export async function exportCustomerListExcel(rows: CustomerListRow[], canViewPrices = true) {
  const reservationIds = rows.map((row) => row.reservation.id)
  const [guestMap, paymentsMap] = await Promise.all([
    fetchGuestEntriesForReservations(reservationIds),
    fetchPaymentsByReservationIds(reservationIds),
  ])
  const exportRows = rows.map((row) =>
    buildCustomerExportRow(
      row,
      guestMap.get(row.reservation.id) ?? [],
      canViewPrices,
      paymentsMap.get(row.reservation.id) ?? [],
    ),
  )

  exportRowsToExcel('musteri-listesi', CUSTOMER_EXPORT_COLUMNS, exportRows)
}

export async function exportCustomerListPdf(rows: CustomerListRow[], canViewPrices = true) {
  const reservationIds = rows.map((row) => row.reservation.id)
  const [guestMap, paymentsMap] = await Promise.all([
    fetchGuestEntriesForReservations(reservationIds),
    fetchPaymentsByReservationIds(reservationIds),
  ])
  const exportRows = rows.map((row) =>
    buildCustomerExportRow(
      row,
      guestMap.get(row.reservation.id) ?? [],
      canViewPrices,
      paymentsMap.get(row.reservation.id) ?? [],
    ),
  )

  await exportRowsToPdf(
    'musteri-listesi',
    'Müşteri / Rezervasyon Listesi',
    CUSTOMER_EXPORT_COLUMNS,
    exportRows,
  )
}

export async function exportRoomReservationsExcel(
  roomName: string,
  reservations: Reservation[],
  canViewPrices = true,
) {
  const reservationIds = reservations.map((reservation) => reservation.id)
  const [guestMap, paymentsMap] = await Promise.all([
    fetchGuestEntriesForReservations(reservationIds),
    fetchPaymentsByReservationIds(reservationIds),
  ])
  const rows = reservations.map((reservation) =>
    buildRoomExportRow(
      roomName,
      reservation,
      guestMap.get(reservation.id) ?? [],
      canViewPrices,
      paymentsMap.get(reservation.id) ?? [],
    ),
  )

  exportRowsToExcel(`oda-${roomName}-rezervasyonlar`, ROOM_EXPORT_COLUMNS, rows)
}
