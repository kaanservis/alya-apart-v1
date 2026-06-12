import { parseTurkeyDateKey } from '../lib/turkeyDate'

export function calculateNights(girisTarihi: string, cikisTarihi: string): number {
  if (!girisTarihi || !cikisTarihi || cikisTarihi < girisTarihi) {
    return 0
  }

  if (girisTarihi === cikisTarihi) {
    return 1
  }

  const start = parseTurkeyDateKey(girisTarihi)
  const end = parseTurkeyDateKey(cikisTarihi)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(1, Math.round(diffMs / 86_400_000))
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateTotalFromDaily(dailyPrice: number, nights: number): number {
  if (nights <= 0 || dailyPrice < 0) {
    return 0
  }

  return roundMoney(dailyPrice * nights)
}

export function calculateDailyFromTotal(totalPrice: number, nights: number): number {
  if (nights <= 0 || totalPrice < 0) {
    return 0
  }

  return roundMoney(totalPrice / nights)
}

export function deriveDailyPrice(
  gunlukUcret: number | undefined,
  toplamUcret: number,
  girisTarihi: string,
  cikisTarihi: string,
): number {
  if (gunlukUcret != null && gunlukUcret > 0) {
    return gunlukUcret
  }

  const nights = calculateNights(girisTarihi, cikisTarihi)
  return calculateDailyFromTotal(toplamUcret, nights)
}
