import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { URL } from 'url'
import { existsSync } from 'fs'
import * as Root from '../Root/Root.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')
const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

interface RecordedRequest {
  timestamp: number
  method: string
  url: string
  headers: Record<string, string | string[]>
  response: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
}

interface RequestKey {
  url: string
  method: string
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

    // Convert each request to mock format and save
    let savedCount = 0
    let skippedCount = 0

    for (const request of latestRequests.values()) {
      try {
        // Parse URL to get hostname and pathname
        const parsedUrl = new URL(request.url)
        const hostname = parsedUrl.hostname
        const pathname = parsedUrl.pathname

        // Generate mock filename using the same logic as GetMockFileName
        const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method)
        const mockFilePath = join(MOCK_REQUESTS_DIR, mockFileName)

        // Create mock data structure matching what GetMockResponse expects
        const mockData = {
          response: {
            statusCode: request.response.statusCode,
            statusMessage: request.response.statusMessage,
            headers: request.response.headers,
            body: request.response.body,
            wasCompressed: request.response.wasCompressed,
          },
        }

        // Save mock file
        await writeFile(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8')
        savedCount++
      } catch (error) {
        console.error(`Error converting request ${request.method} ${request.url}:`, error)
        skippedCount++
      }
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
  await convertRequestsToMocks()
}
