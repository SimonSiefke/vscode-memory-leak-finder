import { existsSync } from 'fs'
import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { URL } from 'url'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import type { MockConfigEntry } from '../MockConfigEntry/MockConfigEntry.ts'
import * as Root from '../Root/Root.ts'
import * as ConvertRequestsToMocks from './ConvertRequestsToMocks/ConvertRequestsToMocks.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')
const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

const __dirname = import.meta.dirname
const MOCK_CONFIG_PATH = join(__dirname, '..', 'GetMockFileName', 'mock-config.json')

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

    // Read all files from requests directory
    const files = await readdir(REQUESTS_DIR)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    console.log(`Found ${jsonFiles.length} request files to process`)

    // Map to store latest request for each URL+method combination
    const latestRequests = new Map<string, RecordedRequest>()

    // Process each file
    for (const file of jsonFiles) {
      try {
        const filePath = join(REQUESTS_DIR, file)
        const content = await readFile(filePath, 'utf8')
        const request: RecordedRequest = JSON.parse(content)

        // Create a key from URL and method
        const key = `${request.method}:${request.url}`

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

    console.log(`Found ${latestRequests.size} unique request/response pairs`)

    // Load existing mock config
    const mockConfig = await loadMockConfig()

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
        const parsedUrl = new URL(request.url)
        const { hostname, pathname } = parsedUrl

        // Generate mock filename using the same logic as GetMockFileName
        const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method)
        const mockFilePath = join(MOCK_REQUESTS_DIR, mockFileName)

        // Create mock data structure matching what GetMockResponse expects
        const mockData = {
          response: {
            body: request.response.body,
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

    // Save updated mock config
    if (configAddedCount > 0) {
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
      console.log(`Added ${configAddedCount} entries to mock-config.json`)
    }

    console.log(`Successfully converted ${savedCount} requests to mocks`)
    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} requests due to errors`)
    }
  } catch (error) {
    console.error('Error converting requests to mocks:', error)
    throw error
  }
}

export const convertRequestsToMocksMain = async (): Promise<void> => {
  await ConvertRequestsToMocks.convertRequestsToMocks()
}
