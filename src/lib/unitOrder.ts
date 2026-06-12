import type { AccommodationUnit } from '../types/database'
import { UNIT_NAMES } from '../types/database'

export function getDefaultDisplayOrderForUnitName(name: string): number {
  const index = UNIT_NAMES.indexOf(name as (typeof UNIT_NAMES)[number])
  return index === -1 ? 9999 : index + 1
}

export function getUnitDisplayOrder(unit: Pick<AccommodationUnit, 'display_order' | 'name'>): number {
  if (unit.display_order > 0) {
    return unit.display_order
  }

  return getDefaultDisplayOrderForUnitName(unit.name)
}

export function sortAccommodationUnitsByDisplayOrder<T extends Pick<AccommodationUnit, 'display_order' | 'name'>>(
  units: T[],
): T[] {
  return [...units].sort(
    (a, b) => getUnitDisplayOrder(a) - getUnitDisplayOrder(b),
  )
}

export const ACCOMMODATION_UNITS_ORDER_COLUMN = 'display_order' as const
