import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

export const getMockFileName = async (hostname: string, pathname: string, method: string, bodyHash?: string): Promise<string> => {
  // Try to load config first
  const config = await loadConfig()
  const configMatch = findConfigMatch(config, hostname, pathname, method)

  if (configMatch) {
    // Ensure method is at the start of the filename
    const methodUpper = method.toUpperCase()
    let filename = configMatch
    
    // Check if filename already starts with the method
    const methodPrefix = `${methodUpper}_`
    if (!filename.startsWith(methodPrefix)) {
      // Remove .json extension, prepend method, then add extension back
      const baseName = filename.replace(/\.json$/, '')
      filename = `${methodUpper}_${baseName}.json`
    }
    
    // If we have a body hash, append it to the filename
    if (bodyHash) {
      const baseName = filename.replace(/\.json$/, '')
      return `${baseName}_${bodyHash}.json`
    }
    return filename
  }

  // Generic fallback: Convert URL to filename format: method_hostname_pathname[_bodyHash].json
  const hostnameSanitized = hostname.replaceAll(NON_ALPHANUMERIC_REGEX, '_')
  const pathnameSanitized = pathname.replaceAll(NON_ALPHANUMERIC_REGEX, '_').replace(LEADING_UNDERSCORES_REGEX, '')
  const methodUpper = method.toUpperCase()
  const pathPart = pathnameSanitized || 'root'
  const hashSuffix = bodyHash ? `_${bodyHash}` : ''
  return `${methodUpper}_${hostnameSanitized}_${pathPart}${hashSuffix}.json`
}
