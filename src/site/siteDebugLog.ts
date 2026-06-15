const PREFIX = '[PublicSite]'

export function siteDebugLog(step: string, payload?: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return
  }

  if (payload) {
    console.log(PREFIX, step, payload)
    return
  }

  console.log(PREFIX, step)
}
