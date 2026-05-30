export function formatDate(date) {
  if (!date) return 'Onbekende datum'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return 'Onbekende datum'
  }

  return parsed.toLocaleString('nl-BE', {
    timeZone: 'Europe/Brussels',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
