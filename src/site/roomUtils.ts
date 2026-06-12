import type { WebsiteRoom } from '../types/database'
import { getPrivateRoomShareSlug } from './roomShareLink'

export function findRoomByShareSlug(rooms: WebsiteRoom[], slug: string) {
  const normalized = slug.toLowerCase()
  return rooms.find((room) => getPrivateRoomShareSlug(room.unitName) === normalized)
}

export function getRoomCoverPhoto(room: WebsiteRoom) {
  return room.photos[0]?.url ?? null
}
