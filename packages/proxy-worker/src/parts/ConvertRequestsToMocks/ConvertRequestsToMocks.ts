import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as IsExpiredTokenErrorResponse from '../IsExpiredTokenErrorResponse/IsExpiredTokenErrorResponse.ts'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'
import * as RequestMockKey from '../RequestMockKey/RequestMockKey.ts'
import * as ReplaceJwtTokensInValue from '../ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeMockData from '../SanitizeMockData/SanitizeMockData.ts'

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
  responseType?: string
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

const shouldReplaceRecordedRequest = (existing: RecordedRequest | undefined, next: RecordedRequest): boolean => {
  if (!existing) {
    return true
  }

  const existingExpiredTokenError = IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(existing.response)
  const nextExpiredTokenError = IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(next.response)

  if (existingExpiredTokenError !== nextExpiredTokenError) {
    return !nextExpiredTokenError
  }

  return next.timestamp > existing.timestamp
}

const getRequestDirectories = async (): Promise<readonly { requestsDir: string; mockRequestsDir: string }[]> => {
  if (!existsSync(REQUESTS_ROOT_DIR)) {
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

  const files = (await readdir(requestsDir)).sort()
  const jsonFiles = files.filter((file) => file.endsWith('.json'))

  console.log(`Found ${jsonFiles.length} request files to process in ${requestsDir}`)

  const latestRequests = new Map<string, RecordedRequest>()
  const pendingRequestBodies = new Map<string, RecordedRequest[]>()

  for (const file of jsonFiles) {
    try {
      const filePath = join(requestsDir, file)
      const content = await readFile(filePath, 'utf8')
      const fileData: RecordedRequestFile = JSON.parse(content)

      const request: RecordedRequest = {
        body: fileData.request.body,
        headers: fileData.request.headers,
        method: fileData.request.method,
        responseType: fileData.metadata.responseType,
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
      if (shouldReplaceRecordedRequest(existing, mergedRequest)) {
        latestRequests.set(key, mergedRequest)
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

      const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method, request.body)
      const mockFilePath = join(mockRequestsDir, mockFileName)

      const processedRequestBody = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInValue(request.body)
      const processedBody = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInValue(
        SanitizeMockData.sanitizeMockBody(await ReplaceJwtTokensInValue.replaceJwtTokensInValue(request.response.body)),
      )
      const processedHeaders = SanitizeMockData.sanitizeMockHeaders(request.response.headers || {})

      const mockData = {
        metadata: {
          responseType: request.responseType,
          timestamp: request.timestamp,
        },
        request: {
          body: processedRequestBody,
          method: request.method,
          url: request.url,
        },
        response: {
          body: processedBody,
          headers: processedHeaders,
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

    let savedCount = 0
    let skippedCount = 0

    const requestDirectories = await getRequestDirectories()
    if (requestDirectories.length === 0) {
      console.log(`Requests directory does not contain any test folders: ${REQUESTS_ROOT_DIR}`)
      console.log('No requests to convert.')
      return
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
