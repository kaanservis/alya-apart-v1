/** Compact private URL slug: "Yaren 2" → yaren2, "201" → 201 */
export function getPrivateRoomShareSlug(unitName: string) {
  return unitName
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function getPrivateRoomSharePath(unitName: string) {
  return `/r/${getPrivateRoomShareSlug(unitName)}`
}

export function buildPrivateRoomShareUrl(unitName: string) {
  const path = getPrivateRoomSharePath(unitName)

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }

  return path
}
