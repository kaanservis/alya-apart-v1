const PREFIX = '[WebsiteManagement/apartments]'

export function logApartmentLoad(step: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(PREFIX, step, payload)
    return
  }
  console.log(PREFIX, step)
}

export function logApartmentLoadError(step: string, error: unknown, payload?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(PREFIX, step, { message, stack, ...payload })
}
