export interface ReservationFormValues {
  ad_soyad: string
  telefon: string
  kisi_sayisi: string
  giris_tarihi: string
  cikis_tarihi: string
  konaklama_birimi_id: string
  gunluk_ucret: string
  toplam_ucret: string
  kapora: string
  kapora_tahsil: string
  giris_te_alinan: string
  notlar: string
}

export interface ReservationFormErrors {
  ad_soyad?: string
  telefon?: string
  kisi_sayisi?: string
  giris_tarihi?: string
  cikis_tarihi?: string
  konaklama_birimi_id?: string
  gunluk_ucret?: string
  toplam_ucret?: string
  kapora?: string
  kapora_tahsil?: string
  giris_te_alinan?: string
  notlar?: string
  conflict?: string
  submit?: string
}

export type PricingSource = 'daily' | 'total' | null

export const EMPTY_RESERVATION_FORM: ReservationFormValues = {
  ad_soyad: '',
  telefon: '',
  kisi_sayisi: '1',
  giris_tarihi: '',
  cikis_tarihi: '',
  konaklama_birimi_id: '',
  gunluk_ucret: '',
  toplam_ucret: '',
  kapora: '',
  kapora_tahsil: '',
  giris_te_alinan: '',
  notlar: '',
}
