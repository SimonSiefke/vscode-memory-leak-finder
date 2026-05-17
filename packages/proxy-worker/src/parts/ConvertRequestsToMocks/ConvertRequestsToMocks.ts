import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as RequestMockKey from '../RequestMockKey/RequestMockKey.ts'
import * as ReplaceJwtTokensInValue from '../ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'
import * as Root from '../Root/Root.ts'

const REQUESTS_ROOT_DIR = join(Root.root, '.vscode-requests')
const MOCK_REQUESTS_ROOT_DIR = join(Root.root, '.vscode-mock-requests')

interface RecordedRequestFile {
  metadata: {
    responseType: string
    timestamp: number
  }
  request: {
    body?: unknown
    headers: Record<string, string | string[]>
    method: string
    url: string
  }
  response?: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
}

interface RecordedRequest {
  body?: unknown
  headers: Record<string, string | string[]>
  method: string
  response?: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
  timestamp: number
  url: string
}

<<<<<<< HEAD
const getUrlMethodKey = (method: string, url: string): string => {
  return `${method}:${url}`
}

const getHeaderValue = (headers: Record<string, string | string[]>, name: string): string | undefined => {
  const directValue = headers[name]
  if (typeof directValue === 'string') {
    return directValue
  }
  if (Array.isArray(directValue)) {
    return directValue[0]
  }

  const matchingEntry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
  if (!matchingEntry) {
    return undefined
  }
  const [, value] = matchingEntry
  if (typeof value === 'string') {
    return value
  }
  return value[0]
}

const getCorrelationKey = (request: RecordedRequest): string => {
  const requestId = getHeaderValue(request.headers, 'x-request-id')
  if (requestId) {
    return `request-id:${requestId}`
  }

  const agentTaskId = getHeaderValue(request.headers, 'x-agent-task-id')
  if (agentTaskId) {
    return `agent-task-id:${agentTaskId}`
  }

  return getUrlMethodKey(request.method, request.url)
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
=======
const getRequestDirectories = async (): Promise<readonly { requestsDir: string; mockRequestsDir: string }[]> => {
  if (!existsSync(REQUESTS_ROOT_DIR)) {
>>>>>>> origin/main
    return []
  }
  const entries = await readdir(REQUESTS_ROOT_DIR, { withFileTypes: true })
  const requestDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      mockRequestsDir: join(MOCK_REQUESTS_ROOT_DIR, entry.name),
      requestsDir: join(REQUESTS_ROOT_DIR, entry.name),
    }))
  const hasRootJsonFiles = entries.some((entry) => entry.isFile() && entry.name.endsWith('.json'))
  if (hasRootJsonFiles) {
    return [{ mockRequestsDir: MOCK_REQUESTS_ROOT_DIR, requestsDir: REQUESTS_ROOT_DIR }, ...requestDirectories]
  }
  return requestDirectories
}

const convertRequestDirectoryToMocks = async (
  requestsDir: string,
  mockRequestsDir: string,
): Promise<{ savedCount: number; skippedCount: number }> => {
  await mkdir(mockRequestsDir, { recursive: true })

  const files = await readdir(requestsDir)
  const jsonFiles = files.filter((file) => file.endsWith('.json'))

  console.log(`Found ${jsonFiles.length} request files to process in ${requestsDir}`)

  const latestRequests = new Map<string, RecordedRequest>()

  for (const file of jsonFiles) {
    try {
      const filePath = join(requestsDir, file)
      const content = await readFile(filePath, 'utf8')
      const fileData: RecordedRequestFile = JSON.parse(content)

      const request: RecordedRequest = {
        headers: fileData.request.headers,
        method: fileData.request.method,
        response: fileData.response,
        timestamp: fileData.metadata.timestamp,
        url: fileData.request.url,
      }

      const key = `${request.method}:${request.url}`
      const existing = latestRequests.get(key)
      if (!existing || request.timestamp > existing.timestamp) {
        latestRequests.set(key, request)
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error)
    }
  }

  console.log(`Found ${latestRequests.size} unique request/response pairs in ${requestsDir}`)

  let savedCount = 0
  let skippedCount = 0

  for (const request of latestRequests.values()) {
    try {
      if (!request.response || request.response.statusCode === undefined) {
        console.log(`Skipping request ${request.method} ${request.url} - no response data or missing statusCode`)
        skippedCount++
        continue
      }

      let parsedUrl
      try {
        parsedUrl = new URL(request.url)
      } catch (error) {
        console.log({ request })
        throw new VError(error, `Failed to parse ${request.url}`)
      }
      const { hostname, pathname } = parsedUrl

      const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method)
      const mockFilePath = join(mockRequestsDir, mockFileName)

      const processedBody = await ReplaceJwtTokensInValue.replaceJwtTokensInValue(request.response.body)

      const mockData = {
        response: {
          body: processedBody,
          headers: request.response.headers || {},
          statusCode: request.response.statusCode,
          statusMessage: request.response.statusMessage,
          wasCompressed: request.response.wasCompressed,
        },
      }

      await writeFile(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8')
      savedCount++
    } catch (error) {
      console.error(`Error converting request ${request.method} ${request.url}:`, error)
      skippedCount++
    }
  }

  return {
    savedCount,
    skippedCount,
  }
}

const convertRequestsToMocks = async (): Promise<void> => {
  try {
    if (!existsSync(REQUESTS_ROOT_DIR)) {
      console.log(`Requests directory does not exist: ${REQUESTS_ROOT_DIR}`)
      console.log('No requests to convert.')
      return
    }

<<<<<<< HEAD
    // Ensure mock directory exists
    await mkdir(MOCK_REQUESTS_DIR, { recursive: true })

    // Read all files from requests directory
    const files = await readdir(REQUESTS_DIR)
    const jsonFiles = files.filter((file) => file.endsWith('.json')).sort()

    console.log(`Found ${jsonFiles.length} request files to process`)

    // Map to store latest request for each URL+method combination
    const latestRequests = new Map<string, RecordedRequest>()
    const pendingRequestBodies = new Map<string, RecordedRequest[]>()

    // Process each file
    for (const file of jsonFiles) {
      try {
        const filePath = join(REQUESTS_DIR, file)
        const content = await readFile(filePath, 'utf8')
        const fileData: RecordedRequestFile = JSON.parse(content)

        // Transform nested structure to flat structure
        const request: RecordedRequest = {
          body: fileData.request.body,
          headers: fileData.request.headers,
          method: fileData.request.method,
          response: fileData.response,
          timestamp: fileData.metadata.timestamp,
          url: fileData.request.url,
        }

        const hasResponse = request.response && request.response.statusCode !== undefined
        const hasRequestBody = request.body !== undefined
        const correlationKey = getCorrelationKey(request)

        if (hasRequestBody && !hasResponse) {
          const pendingBodies = pendingRequestBodies.get(correlationKey) || []
          pendingBodies.push(request)
          pendingRequestBodies.set(correlationKey, pendingBodies)
          continue
        }

        let mergedRequest = request
        if (hasResponse && !hasRequestBody) {
          const pendingBodies = pendingRequestBodies.get(correlationKey)
          const nearestPendingBody = pendingBodies?.pop()
          if (nearestPendingBody) {
            mergedRequest = {
              ...request,
              body: nearestPendingBody.body,
              headers: nearestPendingBody.headers,
            }
          }
          if (pendingBodies && pendingBodies.length > 0) {
            pendingRequestBodies.set(correlationKey, pendingBodies)
          } else {
            pendingRequestBodies.delete(correlationKey)
          }
        }

        const key = RequestMockKey.getRequestIdentityKey(mergedRequest.method, mergedRequest.url, mergedRequest.body)
        const existing = latestRequests.get(key)
        if (!existing || mergedRequest.timestamp > existing.timestamp) {
          latestRequests.set(key, mergedRequest)
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
=======
>>>>>>> origin/main
    let savedCount = 0
    let skippedCount = 0

<<<<<<< HEAD
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
        const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method, request.body)
        const mockFilePath = join(MOCK_REQUESTS_DIR, mockFileName)

        // Replace JWT tokens in response body with new tokens that expire in 1 year
        const processedBody = await ReplaceJwtTokensInValue.replaceJwtTokensInValue(request.response.body)

        // Create mock data structure matching what GetMockResponse expects
        const mockData = {
          request: {
            body: request.body,
            method: request.method,
            url: request.url,
          },
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
=======
    const requestDirectories = await getRequestDirectories()
    if (requestDirectories.length === 0) {
      console.log(`Requests directory does not contain any test folders: ${REQUESTS_ROOT_DIR}`)
      console.log('No requests to convert.')
      return
>>>>>>> origin/main
    }

    for (const requestDirectory of requestDirectories) {
      const result = await convertRequestDirectoryToMocks(requestDirectory.requestsDir, requestDirectory.mockRequestsDir)
      savedCount += result.savedCount
      skippedCount += result.skippedCount
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
