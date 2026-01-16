export const matchesPattern = (value: string, pattern: string): boolean => {
  if (pattern === '*') {
    return true
  }
  if (pattern.includes('*')) {
    // Simple wildcard matching: convert pattern to regex
    const regexPattern = pattern.replaceAll('*', '.*').replaceAll('?', '.')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(value)
  }
  return value === pattern
}
