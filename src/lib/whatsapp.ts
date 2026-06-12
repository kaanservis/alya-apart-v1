import { getBusinessWhatsAppNumberRaw } from '../settings/businessSettings'

export type WhatsAppMessageTemplate = 'checkIn' | 'checkoutReminder' | 'paymentReminder'

export function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/[\s\-()]/g, '').replace(/\D/g, '')

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0')) {
    return `90${digits.slice(1)}`
  }

  if (digits.startsWith('90')) {
    return digits
  }

  if (digits.startsWith('5') && digits.length === 10) {
    return `90${digits}`
  }

  if (digits.length === 10) {
    return `90${digits}`
  }

  return digits
}

export function getBusinessWhatsAppNumber() {
  return normalizePhoneForWhatsApp(getBusinessWhatsAppNumberRaw())
}

export function getGuestWhatsAppUrl(phone: string, message?: string) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone)

  if (!normalizedPhone) {
    return 'https://wa.me/'
  }

  const base = `https://wa.me/${normalizedPhone}`

  if (!message) {
    return base
  }

  return `${base}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppChat(phone: string, message?: string) {
  window.open(getGuestWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
}

export function openGuestWhatsAppChat(phone: string, message?: string) {
  openWhatsAppChat(phone, message)
}

export function openBusinessWhatsAppChat(message?: string) {
  window.open(getGuestWhatsAppUrl(getBusinessWhatsAppNumber(), message), '_blank', 'noopener,noreferrer')
}

function formatBalanceForMessage(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildWhatsAppMessage(
  template: WhatsAppMessageTemplate,
  guest: { adSoyad: string; kalanBakiye?: number },
) {
  switch (template) {
    case 'checkIn':
      return `Merhaba ${guest.adSoyad},\nALYA APART rezervasyonunuz onaylanmıştır.`
    case 'checkoutReminder':
      return `Merhaba ${guest.adSoyad},\nBugün çıkış tarihinizdir.`
    case 'paymentReminder':
      return `Merhaba ${guest.adSoyad},\nKalan bakiyeniz: ${formatBalanceForMessage(guest.kalanBakiye ?? 0)} TL`
  }
}

export const WHATSAPP_QUICK_MESSAGES: {
  template: WhatsAppMessageTemplate
  label: string
}[] = [
  { template: 'checkIn', label: 'Giriş Bilgilendirmesi' },
  { template: 'checkoutReminder', label: 'Çıkış Hatırlatması' },
  { template: 'paymentReminder', label: 'Ödeme Hatırlatması' },
]
