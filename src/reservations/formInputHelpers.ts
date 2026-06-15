export function toTurkishUppercase(value: string): string {
  return value
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toLocaleUpperCase('tr-TR')
}

export function normalizeTcDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, 11)
}

export function validateTcNumber(value: string): string | null {
  const digits = normalizeTcDigits(value)

  if (digits.length !== 11) {
    return 'TC Kimlik Numarası 11 haneli olmalıdır.'
  }

  return null
}

export function normalizePhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.length === 0) {
    return ''
  }

  if (digits.startsWith('5')) {
    digits = `0${digits}`
  } else if (!digits.startsWith('0')) {
    digits = `0${digits}`
  }

  return digits.slice(0, 11)
}

export function formatPhoneDisplay(digits: string): string {
  if (!digits) {
    return ''
  }

  if (digits.length <= 4) {
    return digits
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
}

export function sanitizePriceInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '')
  const separatorIndex = cleaned.search(/[.,]/)

  if (separatorIndex === -1) {
    return cleaned
  }

  const integerPart = cleaned.slice(0, separatorIndex)
  const decimalPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '')
  const separator = cleaned[separatorIndex]

  return `${integerPart}${separator}${decimalPart}`
}
