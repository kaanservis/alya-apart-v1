export function getGuestInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('')
    .slice(0, 4)
}

export function formatGuestNamesList(
  reservationOwner: string,
  guests: { full_name: string }[],
) {
  const names = [reservationOwner, ...guests.map((guest) => guest.full_name)]
  return names.join(', ')
}
