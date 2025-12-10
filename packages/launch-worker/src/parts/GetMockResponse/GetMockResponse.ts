import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { ServerResponse } from 'http'
import * as Root from '../Root/Root.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'

const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

export interface MockResponse {
  statusCode: number
  headers: Record<string, string | string[]>
  body: any
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

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
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

    // VS Code Marketplace CDN and Extensions CDN - use real data (pass through)
    if (
      hostname.includes('marketplace.visualstudio.com') ||
      hostname.includes('gallerycdn.vsassets.io') ||
      hostname.includes('gallery.vsassets.io')
    ) {
      return null // Pass through
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
  const bodyStr = typeof mockResponse.body === 'string' ? mockResponse.body : JSON.stringify(mockResponse.body)
  const bodyBuffer = Buffer.from(bodyStr, 'utf8')

  // Convert headers to the format expected by writeHead
  const headers: Record<string, string> = {}
  Object.entries(mockResponse.headers).forEach(([key, value]) => {
    // Skip Content-Length headers (case-insensitive) - we'll set it below
    if (key.toLowerCase() !== 'content-length') {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
    }
  })

  // Always set Content-Length to match actual body length
  headers['Content-Length'] = String(bodyBuffer.length)

  res.writeHead(mockResponse.statusCode, headers)
  res.end(bodyBuffer)
}
