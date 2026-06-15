const PREFIX = '[RoomGuestsSection]'

/** Alias used in docs: GuestSection */
export function logGuestSection(step: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(PREFIX, step, payload)
    return
  }
  console.log(PREFIX, step)
}

/** Alias: GuestList / GuestPhotos share the guest section log prefix. */
export const logGuestList = logGuestSection
export const logGuestPhotos = logGuestSection
