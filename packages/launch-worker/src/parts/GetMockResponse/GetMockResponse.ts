import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { ServerResponse } from 'http'
import * as Root from '../Root/Root.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as LoadZipData from '../LoadZipData/LoadZipData.ts'

const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

export interface MockResponse {
  statusCode: number
  headers: Record<string, string | string[]>
  body: any | Buffer
}

const loadMockResponse = async (mockFile: string): Promise<MockResponse | null> => {
  try {
    if (!existsSync(mockFile)) {
      return null
    }

    const mockData = JSON.parse(await readFile(mockFile, 'utf8'))
    const response = mockData.response

    // Handle OPTIONS requests specially - they might have empty body
    if (response.statusCode === 204) {
      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: '',
      }
    }

    // Handle file references (for zip files)
    let body = response.body
    if (typeof body === 'string' && body.startsWith('file-reference:')) {
      const zipData = await LoadZipData.loadZipData(body)
      if (zipData) {
        body = zipData
      }
    }

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body,
    }
  } catch (error) {
    console.error(`[Proxy] Error loading mock file ${mockFile}:`, error)
    return null
  }
}

export const getMockResponse = async (method: string, url: string): Promise<MockResponse | null> => {
  try {
    const { URL } = await import('url')
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname
    const pathname = parsedUrl.pathname

    // Handle OPTIONS preflight requests - return a proper CORS preflight response
    if (method === 'OPTIONS') {
      const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method)
      const mockFile = join(MOCK_REQUESTS_DIR, mockFileName)
      const mockResponse = await loadMockResponse(mockFile)

      if (mockResponse) {
        return mockResponse
      }

      // If no OPTIONS mock exists, create a default preflight response
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type, accept, x-requested-with',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
        body: '',
      }
    }

    // Try to load mock from file
    const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method)
    const mockFile = join(MOCK_REQUESTS_DIR, mockFileName)
    const mockResponse = await loadMockResponse(mockFile)

    if (mockResponse) {
      return mockResponse
    }

    return null // No mock found, pass through
  } catch (error) {
    console.error('[Proxy] Error getting mock response:', error)
    return null // On error, pass through
  }
}

export const sendMockResponse = (res: ServerResponse, mockResponse: MockResponse, httpVersion: string = 'HTTP/1.1'): void => {
  let bodyBuffer: Buffer
  if (mockResponse.body === null || mockResponse.body === undefined) {
    bodyBuffer = Buffer.alloc(0)
  } else if (Buffer.isBuffer(mockResponse.body)) {
    bodyBuffer = mockResponse.body
  } else if (typeof mockResponse.body === 'string') {
    bodyBuffer = Buffer.from(mockResponse.body, 'utf8')
  } else {
    bodyBuffer = Buffer.from(JSON.stringify(mockResponse.body), 'utf8')
  }

  // Convert headers to the format expected by writeHead and check for existing CORS headers
  const headers: Record<string, string> = {}
  const lowerCaseHeaders: Set<string> = new Set()

  Object.entries(mockResponse.headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase()
    // Skip Content-Length headers (case-insensitive) - we'll set it below
    if (lowerKey !== 'content-length') {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
      lowerCaseHeaders.add(lowerKey)
    }
  })

  // Add CORS headers if not already present (case-insensitive check)
  if (!lowerCaseHeaders.has('access-control-allow-origin')) {
    headers['Access-Control-Allow-Origin'] = '*'
  }
  if (!lowerCaseHeaders.has('access-control-allow-methods')) {
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  }
  if (!lowerCaseHeaders.has('access-control-allow-headers')) {
    headers['Access-Control-Allow-Headers'] = 'authorization, content-type, accept, x-requested-with'
  }
  if (!lowerCaseHeaders.has('access-control-allow-credentials')) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  // Always set Content-Length to match actual body length
  headers['Content-Length'] = String(bodyBuffer.length)

  res.writeHead(mockResponse.statusCode, headers)
  res.end(bodyBuffer)
}
