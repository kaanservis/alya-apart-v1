import {
  normalizeTcDigits,
  toTurkishUppercase,
  validateTcNumber,
} from '../reservations/formInputHelpers'

export interface GuestFormValues {
  fullName: string
  tcNo: string
  phone: string
  notes: string
}

export interface GuestFormFieldErrors {
  fullName?: string
  tcNo?: string
}

export function validateGuestFormFields(form: Pick<GuestFormValues, 'fullName' | 'tcNo'>) {
  const errors: GuestFormFieldErrors = {}

  if (!form.fullName.trim()) {
    errors.fullName = 'Ad Soyad zorunludur.'
  }

  const tcError = validateTcNumber(form.tcNo)
  if (tcError) {
    errors.tcNo = tcError
  }

  return errors
}

export function hasGuestFormErrors(errors: GuestFormFieldErrors) {
  return Boolean(errors.fullName || errors.tcNo)
}

export function isGuestFormSubmittable(form: Pick<GuestFormValues, 'fullName' | 'tcNo'>) {
  return !hasGuestFormErrors(validateGuestFormFields(form))
}

export function applyGuestFullNameInput(value: string) {
  return toTurkishUppercase(value)
}

export function applyGuestTcInput(value: string) {
  return normalizeTcDigits(value)
}

export function applyGuestTcPaste(pasteValue: string) {
  return normalizeTcDigits(pasteValue)
}
