import type { ApartmentProfile } from '../types/database'

export const PUBLIC_APARTMENT_NAMES = ['ALYA APART', 'ALYA APART 2'] as const

export function selectDisplayApartments(apartments: ApartmentProfile[]) {
  return PUBLIC_APARTMENT_NAMES.map((name) =>
    apartments.find((profile) => profile.apartment.name === name),
  ).filter((profile): profile is ApartmentProfile => profile != null)
}
