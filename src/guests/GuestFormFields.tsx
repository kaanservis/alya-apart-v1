import {
  applyGuestFullNameInput,
  applyGuestTcInput,
  applyGuestTcPaste,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from './guestFormValidation'

interface GuestFormFieldsProps {
  form: GuestFormValues
  onChange: (updates: Partial<GuestFormValues>) => void
  errors?: GuestFormFieldErrors
  fullNameInputRef?: React.RefObject<HTMLInputElement | null>
  showPhoneAndNotes?: boolean
  accentClassName?: string
}

function handleTcKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowedKeys.includes(event.key)) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function handleTcBeforeInput(event: React.FormEvent<HTMLInputElement>) {
  const nativeEvent = event.nativeEvent as InputEvent
  if (!nativeEvent.data) {
    return
  }

  if (/\D/.test(nativeEvent.data)) {
    event.preventDefault()
  }
}

export function GuestFormFields({
  form,
  onChange,
  errors,
  fullNameInputRef,
  showPhoneAndNotes = true,
  accentClassName = 'ring-indigo-600',
}: GuestFormFieldsProps) {
  const tcIncomplete = form.tcNo.length > 0 && form.tcNo.length < 11

  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Ad Soyad</span>
        <input
          ref={fullNameInputRef}
          type="text"
          autoComplete="name"
          value={form.fullName}
          onChange={(event) =>
            onChange({ fullName: applyGuestFullNameInput(event.target.value) })
          }
          onInput={(event) =>
            onChange({ fullName: applyGuestFullNameInput(event.currentTarget.value) })
          }
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
            errors?.fullName ? 'border-red-300 bg-red-50' : 'border-slate-300'
          } ${accentClassName}`}
        />
        {errors?.fullName && (
          <span className="mt-1 block text-xs text-red-600">{errors.fullName}</span>
        )}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">TC Kimlik No</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          value={form.tcNo}
          onChange={(event) => onChange({ tcNo: applyGuestTcInput(event.target.value) })}
          onKeyDown={handleTcKeyDown}
          onBeforeInput={handleTcBeforeInput}
          onPaste={(event) => {
            event.preventDefault()
            onChange({ tcNo: applyGuestTcPaste(event.clipboardData.getData('text')) })
          }}
          placeholder="11 haneli TC kimlik no"
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
            errors?.tcNo || tcIncomplete ? 'border-red-300 bg-red-50' : 'border-slate-300'
          } ${accentClassName}`}
        />
        {errors?.tcNo && <span className="mt-1 block text-xs text-red-600">{errors.tcNo}</span>}
        {!errors?.tcNo && tcIncomplete && (
          <span className="mt-1 block text-xs text-amber-700">
            TC Kimlik Numarası 11 haneli olmalıdır.
          </span>
        )}
      </label>

      {showPhoneAndNotes && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Telefon</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 ${accentClassName}`}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Not</span>
            <textarea
              value={form.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              rows={2}
              className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 ${accentClassName}`}
            />
          </label>
        </>
      )}
    </>
  )
}
