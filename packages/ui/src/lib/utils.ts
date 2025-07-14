import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp?: string) {
  if (!timestamp) return 'N/A'

  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuration(duration?: number) {
  if (!duration) return 'N/A'

  const durationObj = dayjs.duration(duration, 'millisecond')

  if (durationObj.asHours() >= 1) {
    return durationObj.format('H[h] m[m] s[s]')
  }

  if (durationObj.asMinutes() >= 1) {
    const minutes = Math.floor(durationObj.asMinutes())
    const seconds = durationObj.seconds()
    return `${minutes}m ${seconds}s`
  }

  if (durationObj.asSeconds() >= 1) {
    const seconds = durationObj.asSeconds()
    return `${seconds.toFixed(1)}s`
  }

  return `${duration}ms`
}
