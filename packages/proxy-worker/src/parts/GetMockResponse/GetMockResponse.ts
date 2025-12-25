import type { ServerResponse } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import type { MockResponse } from '../MockResponse/MockResponse.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as LoadZipData from '../LoadZipData/LoadZipData.ts'
import * as Root from '../Root/Root.ts'

const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

const loadMockResponse = async (mockFile: string): Promise<MockResponse | null> => {
  try {
    if (!existsSync(mockFile)) {
      return null
    }

    const mockData = JSON.parse(await readFile(mockFile, 'utf8'))
    const { response } = mockData

    // Handle OPTIONS requests specially - they might have empty body
    if (response.statusCode === 204) {
      return {
        body: '',
        headers: response.headers,
        statusCode: response.statusCode,
      }
    }

    // Handle file references (for zip files)
    let { body } = response
    let isZipFile = false
    if (typeof body === 'string' && body.startsWith('file-reference:')) {
      const zipData = await LoadZipData.loadZipData(body)
      if (zipData) {
        body = zipData
        isZipFile = true
      }
    }

    // Check if this is a zip file by content type
    const contentType = response.headers['content-type'] || response.headers['Content-Type']
    const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
    if (contentTypeStr.includes('application/zip')) {
      isZipFile = true
    }

    // Remove Content-Encoding and Transfer-Encoding headers for zip files
    // since the binary data is not encoded
    const cleanedHeaders = { ...response.headers }
    if (isZipFile) {
      const lowerCaseHeaders: Set<string> = new Set()
      for (const k of Object.keys(cleanedHeaders)) {
        lowerCaseHeaders.add(k.toLowerCase())
      }
      if (lowerCaseHeaders.has('content-encoding')) {
        for (const k of Object.keys(cleanedHeaders)) {
          if (k.toLowerCase() === 'content-encoding') {
            delete cleanedHeaders[k]
          }
        }
      }
      if (lowerCaseHeaders.has('transfer-encoding')) {
        for (const k of Object.keys(cleanedHeaders)) {
          if (k.toLowerCase() === 'transfer-encoding') {
            delete cleanedHeaders[k]
          }
        }
      }
    }

    return {
      body,
      headers: cleanedHeaders,
      statusCode: response.statusCode,
    }
  } catch (error) {
    console.error(`[Proxy] Error loading mock file ${mockFile}:`, error)
    return null
  }
}

export const getMockResponse = async (method: string, url: string): Promise<MockResponse | null> => {
  try {
    const parsedUrl = new URL(url)
    const { hostname } = parsedUrl
    const { pathname } = parsedUrl

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
        body: '',
        headers: {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'authorization, content-type, accept, x-requested-with',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Max-Age': '86400',
        },
        statusCode: 204,
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

  // Check if this is a zip file (binary data)
  const contentType = mockResponse.headers['content-type'] || mockResponse.headers['Content-Type']
  const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
  // Check for ZIP magic bytes (PK - ZIP file signature)
  const hasZipMagicBytes = Buffer.isBuffer(bodyBuffer) && bodyBuffer.length >= 2 && bodyBuffer[0] === 0x50 && bodyBuffer[1] === 0x4b
  const isZipFile = contentTypeStr.includes('application/zip') || hasZipMagicBytes

  if (isZipFile) {
    console.log(
      `[Proxy] Detected zip file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}, Has magic bytes: ${hasZipMagicBytes}`,
    )
  }

  // Convert headers to the format expected by writeHead and check for existing CORS headers
  const headers: Record<string, string> = {}
  const lowerCaseHeaders: Set<string> = new Set()

  for (const [key, value] of Object.entries(mockResponse.headers)) {
    const lowerKey = key.toLowerCase()
    // Skip Content-Length headers (case-insensitive) - we'll set it below
    // Skip Content-Encoding and Transfer-Encoding headers for zip files - binary data is not encoded
    if (lowerKey !== 'content-length' && !(isZipFile && (lowerKey === 'content-encoding' || lowerKey === 'transfer-encoding'))) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
      lowerCaseHeaders.add(lowerKey)
    }
  }

  // Double-check: explicitly remove Content-Encoding and Transfer-Encoding for zip files
  if (isZipFile) {
    const keysToRemove: string[] = []
    for (const k of Object.keys(headers)) {
      const lowerKey = k.toLowerCase()
      if (lowerKey === 'content-encoding' || lowerKey === 'transfer-encoding') {
        keysToRemove.push(k)
      }
    }
    for (const k of keysToRemove) {
      delete headers[k]
      lowerCaseHeaders.delete(k.toLowerCase())
    }
    console.log(`[Proxy] sendMockResponse - Final headers for zip file (after cleanup):`, Object.keys(headers))
  }

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

export { type MockResponse } from '../MockResponse/MockResponse.ts'
