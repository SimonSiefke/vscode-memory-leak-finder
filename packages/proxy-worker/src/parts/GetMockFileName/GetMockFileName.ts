import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { MockConfigEntry } from '../MockConfigEntry/MockConfigEntry.ts'

const __dirname = import.meta.dirname
const MOCK_CONFIG_PATH = join(__dirname, 'mock-config.json')
const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]/g
const LEADING_UNDERSCORES_REGEX = /^_+/

const matchesPattern = (value: string, pattern: string): boolean => {
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

const loadConfig = async (): Promise<MockConfigEntry[]> => {
  try {
    if (!existsSync(MOCK_CONFIG_PATH)) {
      return []
    }
    const configContent = await readFile(MOCK_CONFIG_PATH, 'utf8')
    return JSON.parse(configContent) as MockConfigEntry[]
  } catch (error) {
    console.error(`[Proxy] Error loading mock config from ${MOCK_CONFIG_PATH}:`, error)
    return []
  }
}

const findConfigMatch = (config: MockConfigEntry[], hostname: string, pathname: string, method: string): string | null => {
  const methodLower = method.toLowerCase()

  for (const entry of config) {
    const hostnameMatch = matchesPattern(hostname, entry.hostname) || hostname.includes(entry.hostname)
    const pathnameMatch = matchesPattern(pathname, entry.pathname)
    const methodMatch = matchesPattern(methodLower, entry.method.toLowerCase())

    if (hostnameMatch && pathnameMatch && methodMatch) {
      return entry.filename
    }
  }

  return null
}

export const getMockFileName = async (hostname: string, pathname: string, method: string): Promise<string> => {
  // Try to load config first
  const config = await loadConfig()
  const configMatch = findConfigMatch(config, hostname, pathname, method)

  if (configMatch) {
    return configMatch
  }

  // Generic fallback: Convert URL to filename format: hostname_pathname_method.json
  const hostnameSanitized = hostname.replaceAll(NON_ALPHANUMERIC_REGEX, '_')
  const pathnameSanitized = pathname.replaceAll(NON_ALPHANUMERIC_REGEX, '_').replace(LEADING_UNDERSCORES_REGEX, '')
  const methodLower = method.toLowerCase()
  const pathPart = pathnameSanitized || 'root'
  return `${hostnameSanitized}_${pathPart}_${methodLower}.json`
}
