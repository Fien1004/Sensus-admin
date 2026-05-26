export function formatDuration(durationMs) {
  const ms = Number(durationMs) || 0
  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) return `${seconds} sec`

  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60

  if (restSeconds === 0) return `${minutes} min`

  return `${minutes} min ${restSeconds} sec`
}
