import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as GetProxyPaths from '../GetProxyPaths/GetProxyPaths.ts'
import * as IsExpiredTokenErrorResponse from '../IsExpiredTokenErrorResponse/IsExpiredTokenErrorResponse.ts'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'
import * as ReplaceJwtTokensInValue from '../ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'
import * as SanitizeMockData from '../SanitizeMockData/SanitizeMockData.ts'

interface SaveMockFileOptions {
  readonly method: string
  readonly requestBody?: unknown
  readonly response: {
    readonly body: unknown
    readonly headers: Record<string, string | string[]>
    readonly statusCode: number
    readonly statusMessage?: string
    readonly wasCompressed?: boolean
  }
  readonly responseType: string
  readonly timestamp: number
  readonly url: string
}

export const saveMockFile = async (options: SaveMockFileOptions): Promise<string> => {
  const { hostname, pathname } = new URL(options.url)
  const mockRequestsDir = GetProxyPaths.getMockRequestsDir()
  await mkdir(mockRequestsDir, { recursive: true })

  const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, options.method, options.requestBody)
  const mockFilePath = join(mockRequestsDir, mockFileName)

  if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(options.response) && existsSync(mockFilePath)) {
    const existingMock = JSON.parse(await readFile(mockFilePath, 'utf8'))
    if (!IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(existingMock.response)) {
      return mockFilePath
    }
  }

  const processedRequestBody = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInValue(options.requestBody)
  const processedBody = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInValue(
    SanitizeMockData.sanitizeMockBody(await ReplaceJwtTokensInValue.replaceJwtTokensInValue(options.response.body)),
  )
  const processedHeaders = SanitizeMockData.sanitizeMockHeaders(options.response.headers)

  const mockData = {
    metadata: {
      responseType: options.responseType,
      timestamp: options.timestamp,
    },
    request: {
      body: processedRequestBody,
      method: options.method,
      url: options.url,
    },
    response: {
      body: processedBody,
      headers: processedHeaders,
      statusCode: options.response.statusCode,
      statusMessage: options.response.statusMessage,
      wasCompressed: options.response.wasCompressed,
    },
  }

  await writeFile(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8')
  return mockFilePath
}
