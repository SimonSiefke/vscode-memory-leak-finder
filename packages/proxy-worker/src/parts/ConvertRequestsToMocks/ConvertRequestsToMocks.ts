import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
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
    headers: Record<string, string | string[]>
    method: string
    url: string
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
