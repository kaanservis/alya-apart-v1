import type { WebsiteSettingsRow } from '../types/database'

/** Columns loaded and saved by Website Management and the public site. */
export const WEBSITE_SETTINGS_FIELDS = [
  'site_title',
  'site_subtitle',
  'hero_image_path',
  'phone',
  'whatsapp',
  'instagram',
  'address',
  'welcome_text',
  'about_short',
  'maps_link',
  'maps_embed',
] as const satisfies readonly (keyof WebsiteSettingsRow)[]

export type WebsiteSettingsFormFields = Pick<
  WebsiteSettingsRow,
  (typeof WEBSITE_SETTINGS_FIELDS)[number]
>

export const WEBSITE_SETTINGS_SELECT = WEBSITE_SETTINGS_FIELDS.join(',')

export const EMPTY_WEBSITE_SETTINGS_FORM: WebsiteSettingsFormFields = {
  site_title: '',
  site_subtitle: '',
  hero_image_path: null,
  phone: '',
  whatsapp: '',
  instagram: '',
  address: '',
  welcome_text: '',
  about_short: '',
  maps_link: '',
  maps_embed: '',
}

export function pickWebsiteSettingsFormFields(
  settings: WebsiteSettingsRow,
): WebsiteSettingsFormFields {
  return {
    site_title: settings.site_title,
    site_subtitle: settings.site_subtitle,
    hero_image_path: settings.hero_image_path,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    instagram: settings.instagram,
    address: settings.address,
    welcome_text: settings.welcome_text,
    about_short: settings.about_short,
    maps_link: settings.maps_link,
    maps_embed: settings.maps_embed,
  }
}
