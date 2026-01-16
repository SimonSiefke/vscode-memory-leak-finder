export const isUnixTimestamp = (value: any): boolean => {
  if (typeof value !== 'number') {
    return false
  }
  // Check if it's a reasonable Unix timestamp (between year 2000 and year 2100)
  const minTimestamp = 946_684_800 // 2000-01-01
  const maxTimestamp = 4_102_444_800 // 2100-01-01
  return value >= minTimestamp && value <= maxTimestamp
}
