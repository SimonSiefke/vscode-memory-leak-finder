export const cn = (...classes: Array<string | false | null | undefined>): string => {
  return classes.filter(Boolean).join(' ')
}

export const formatRelativeTime = (value: string): string => {
  const date = new Date(value)
  const diff = date.getTime() - Date.now()
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
  ]

  for (const [unit, milliseconds] of units) {
    const amount = Math.round(diff / milliseconds)
    if (Math.abs(amount) >= 1) {
      return formatter.format(amount, unit)
    }
  }

  return 'just now'
}

export const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
