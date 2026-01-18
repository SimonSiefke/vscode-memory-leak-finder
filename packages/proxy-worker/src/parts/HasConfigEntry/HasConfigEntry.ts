import type { MockConfigEntry } from '../MockConfigEntry/MockConfigEntry.ts'
import * as MatchesPattern from '../MatchesPattern/MatchesPattern.ts'

export const hasConfigEntry = (config: MockConfigEntry[], hostname: string, pathname: string, method: string): boolean => {
  const methodLower = method.toLowerCase()
  for (const entry of config) {
    const hostnameMatch = MatchesPattern.matchesPattern(hostname, entry.hostname) || hostname.includes(entry.hostname)
    const pathnameMatch = MatchesPattern.matchesPattern(pathname, entry.pathname)
    const methodMatch = MatchesPattern.matchesPattern(methodLower, entry.method.toLowerCase())
    if (hostnameMatch && pathnameMatch && methodMatch) {
      return true
    }
  }
  return false
}
