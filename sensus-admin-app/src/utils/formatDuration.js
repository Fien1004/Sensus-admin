export function formatDuration(durationMs) {
  const ms = Number(durationMs) || 0
  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) return `${seconds} sec`

  const minutes = Math.floor(seconds / 60)
  const restSeconds = String(seconds % 60).padStart(2, '0')

  if (minutes < 60) return `${minutes}m ${restSeconds}s`

  const hours = Math.floor(minutes / 60)
  const restMinutes = String(minutes % 60).padStart(2, '0')

  return `${hours}u ${restMinutes}m`
}
