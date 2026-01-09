import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import type { MockConfigEntry } from '../MockConfigEntry/MockConfigEntry.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as Root from '../Root/Root.ts'
import * as ReplaceJwtTokensInValue from '../ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'
import { VError } from '@lvce-editor/verror'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')
const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

const __dirname = import.meta.dirname
const MOCK_CONFIG_PATH = join(__dirname, '..', 'GetMockFileName', 'mock-config.json')

interface RecordedRequestFile {
  metadata: {
    responseType: string
    timestamp: number
  }
  request: {
    headers: Record<string, string | string[]>
    method: string
    url: string
    body?: any
    bodyHash?: string
  }
  response: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
}

interface RecordedRequest {
  headers: Record<string, string | string[]>
  method: string
  response: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
  timestamp: number
  url: string
  body?: any
  bodyHash?: string
}

const loadMockConfig = async (): Promise<MockConfigEntry[]> => {
  try {
    if (!existsSync(MOCK_CONFIG_PATH)) {
      return []
    }
    const configContent = await readFile(MOCK_CONFIG_PATH, 'utf8')
    return JSON.parse(configContent) as MockConfigEntry[]
  } catch (error) {
    console.error(`Error loading mock config from ${MOCK_CONFIG_PATH}:`, error)
    return []
  }
}

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

const hasConfigEntry = (config: MockConfigEntry[], hostname: string, pathname: string, method: string): boolean => {
  const methodLower = method.toLowerCase()
  for (const entry of config) {
    const hostnameMatch = matchesPattern(hostname, entry.hostname) || hostname.includes(entry.hostname)
    const pathnameMatch = matchesPattern(pathname, entry.pathname)
    const methodMatch = matchesPattern(methodLower, entry.method.toLowerCase())
    if (hostnameMatch && pathnameMatch && methodMatch) {
      return true
    }
  }
  return false
}

const parseJsonSafely = (content: string): RecordedRequestFile | null => {
  try {
    return JSON.parse(content) as RecordedRequestFile
  } catch (error) {
    // Try to find the matching closing brace for the root object
    // This handles cases where there's trailing garbage after valid JSON
    let braceCount = 0
    let rootObjectEnd = -1

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          rootObjectEnd = i
          break
        }
      }
    }

    if (rootObjectEnd > 0) {
      try {
        const truncatedContent = content.substring(0, rootObjectEnd + 1)
        return JSON.parse(truncatedContent) as RecordedRequestFile
      } catch {
        // If truncated version also fails, return null
      }
    }
    return null
  }
}

const convertRequestsToMocks = async (): Promise<void> => {
  try {
    // Check if requests directory exists
    if (!existsSync(REQUESTS_DIR)) {
      console.log(`Requests directory does not exist: ${REQUESTS_DIR}`)
      console.log('No requests to convert.')
      return
    }

    // Ensure mock directory exists
    await mkdir(MOCK_REQUESTS_DIR, { recursive: true })

    // Load existing mock config (shared across all directories)
    const mockConfig = await loadMockConfig()

    // Read all entries from requests directory
    const entries = await readdir(REQUESTS_DIR, { withFileTypes: true })

    // Separate directories and files
    const testDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    const rootFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json')).map((entry) => entry.name)

    let totalSavedCount = 0
    let totalSkippedCount = 0
    let totalConfigAddedCount = 0

    // Process root directory files (backward compatibility)
    if (rootFiles.length > 0) {
      const result = await processRequestsDirectory(REQUESTS_DIR, rootFiles, MOCK_REQUESTS_DIR, mockConfig)
      totalSavedCount += result.savedCount
      totalSkippedCount += result.skippedCount
      totalConfigAddedCount += result.configAddedCount
    }

    // Process each test-specific directory
    for (const testDir of testDirs) {
      const testRequestsDir = join(REQUESTS_DIR, testDir)
      const testMockDir = join(MOCK_REQUESTS_DIR, testDir)
      await mkdir(testMockDir, { recursive: true })

      const testFiles = await readdir(testRequestsDir)
      const testJsonFiles = testFiles.filter((file) => file.endsWith('.json'))

      if (testJsonFiles.length > 0) {
        const result = await processRequestsDirectory(testRequestsDir, testJsonFiles, testMockDir, mockConfig)
        totalSavedCount += result.savedCount
        totalSkippedCount += result.skippedCount
        totalConfigAddedCount += result.configAddedCount
      }
    }

    // Save updated mock config (only once, after processing all directories)
    if (totalConfigAddedCount > 0) {
      // Sort config entries for consistency
      mockConfig.sort((a, b) => {
        if (a.hostname !== b.hostname) {
          return a.hostname.localeCompare(b.hostname)
        }
        if (a.pathname !== b.pathname) {
          return a.pathname.localeCompare(b.pathname)
        }
        return a.method.localeCompare(b.method)
      })
      await writeFile(MOCK_CONFIG_PATH, JSON.stringify(mockConfig, null, 2), 'utf8')
      console.log(`Added ${totalConfigAddedCount} entries to mock-config.json`)
    }

    console.log(`Total: Successfully converted ${totalSavedCount} requests to mocks`)
    if (totalSkippedCount > 0) {
      console.log(`Total: Skipped ${totalSkippedCount} requests due to errors`)
    }
  } catch (error) {
    console.error('Error converting requests to mocks:', error)
    throw error
  }
}

const processRequestsDirectory = async (
  requestsDir: string,
  jsonFiles: string[],
  mockDir: string,
  mockConfig: MockConfigEntry[],
): Promise<{ savedCount: number; skippedCount: number; configAddedCount: number }> => {
  console.log(`Found ${jsonFiles.length} request files to process in ${requestsDir}`)

  // Map to store latest request for each URL+method combination
  const latestRequests = new Map<string, RecordedRequest>()

  // Process each file
  for (const file of jsonFiles) {
    try {
      const filePath = join(requestsDir, file)
      const content = await readFile(filePath, 'utf8')
      const fileData = parseJsonSafely(content)

      if (!fileData) {
        console.error(`Error processing file ${file}: Invalid JSON - skipping`)
        continue
      }

      // Transform nested structure to flat structure
      const request: RecordedRequest = {
        headers: fileData.request.headers,
        method: fileData.request.method,
        url: fileData.request.url,
        response: fileData.response,
        timestamp: fileData.metadata.timestamp,
        body: fileData.request.body,
        bodyHash: fileData.request.bodyHash,
      }

      // Create a key from URL, method, and body hash (if present)
      const key = request.bodyHash ? `${request.method}:${request.url}:${request.bodyHash}` : `${request.method}:${request.url}`

      // Check if we already have a request for this key
      const existing = latestRequests.get(key)
      if (!existing || request.timestamp > existing.timestamp) {
        // Keep the latest one
        latestRequests.set(key, request)
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error)
      // Continue with other files
    }
  }

  console.log(`Found ${latestRequests.size} unique request/response pairs in ${requestsDir}`)

  // Convert each request to mock format and save
  let savedCount = 0
  let skippedCount = 0
  let configAddedCount = 0

  for (const request of latestRequests.values()) {
    try {
      // Skip requests without a response or without required fields
      if (!request.response || request.response.statusCode === undefined) {
        console.log(`Skipping request ${request.method} ${request.url} - no response data or missing statusCode`)
        skippedCount++
        continue
      }

      // Parse URL to get hostname and pathname
      let parsedUrl
      try {
        parsedUrl = new URL(request.url)
      } catch (error) {
        console.log({ request })
        throw new VError(error, `Failed to parse ${request.url}`)
      }
      const { hostname, pathname } = parsedUrl

      // Generate mock filename using the same logic as GetMockFileName
      const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method, request.bodyHash)
      const mockFilePath = join(mockDir, mockFileName)

      // Replace JWT tokens in response body with new tokens that expire in 1 year
      const processedBody = await ReplaceJwtTokensInValue.replaceJwtTokensInValue(request.response.body)

      // Create mock data structure matching what GetMockResponse expects
      const mockData = {
        response: {
          body: processedBody,
          headers: request.response.headers || {},
          statusCode: request.response.statusCode,
          statusMessage: request.response.statusMessage,
          wasCompressed: request.response.wasCompressed,
        },
      }

      // Save mock file
      await writeFile(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8')
      savedCount++

      // Check if we need to add this to mock-config.json
      if (!hasConfigEntry(mockConfig, hostname, pathname, request.method)) {
        const newEntry: MockConfigEntry = {
          filename: mockFileName,
          hostname,
          method: request.method,
          pathname,
        }
        mockConfig.push(newEntry)
        configAddedCount++
      }
    } catch (error) {
      console.error(`Error converting request ${request.method} ${request.url}:`, error)
      skippedCount++
    }
  }

  console.log(`Successfully converted ${savedCount} requests to mocks in ${requestsDir}`)
  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} requests due to errors in ${requestsDir}`)
  }

  return { savedCount, skippedCount, configAddedCount }
}

export const convertRequestsToMocksMain = async (): Promise<void> => {
  await convertRequestsToMocks()
}
