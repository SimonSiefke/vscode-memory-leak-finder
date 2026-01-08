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

    // Handle new format: { metadata, request, response }
    let response: any
    let responseType: 'json' | 'zip' | 'binary' | 'text' | 'sse' | undefined

    if (mockData.metadata && mockData.response) {
      // New format
      response = mockData.response
      responseType = mockData.metadata.responseType
    } else if (mockData.response) {
      // Old format (backward compatibility)
      response = mockData.response
    } else {
      // Fallback: assume old format structure
      response = mockData
    }

    // Handle OPTIONS requests specially - they might have empty body
    if (response.statusCode === 204) {
      return {
        body: '',
        headers: response.headers,
        statusCode: response.statusCode,
      }
    }

    // Handle file references (for zip files, SSE files, etc.)
    let body: any = response.body
    let isZipFile = false
    let isSseFile = false

    if (typeof body === 'string' && body.startsWith('file-reference:')) {
      const fileData = await LoadZipData.loadZipData(body)
      if (fileData) {
        body = fileData
        // Determine file type from responseType or content type
        if (responseType === 'zip') {
          isZipFile = true
        } else if (responseType === 'sse') {
          isSseFile = true
        } else {
          // Fallback to content type check
          const contentType = response.headers['content-type'] || response.headers['Content-Type']
          const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
          if (contentTypeStr.includes('application/zip')) {
            isZipFile = true
          } else if (contentTypeStr.includes('text/event-stream')) {
            isSseFile = true
          }
        }
      }
    } else if (responseType === 'json' && typeof body === 'object') {
      // If responseType is json and body is already an object, stringify it
      body = JSON.stringify(body)
    } else if (responseType === 'zip') {
      isZipFile = true
    } else if (responseType === 'sse') {
      isSseFile = true
    } else {
      // Fallback: check content type
      const contentType = response.headers['content-type'] || response.headers['Content-Type']
      const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
      if (contentTypeStr.includes('application/zip')) {
        isZipFile = true
      } else if (contentTypeStr.includes('text/event-stream')) {
        isSseFile = true
      }
    }

    // Remove Content-Encoding and Transfer-Encoding headers for zip files and SSE files
    // since the binary/text data is not encoded
    const cleanedHeaders = { ...response.headers }
    if (isZipFile || isSseFile) {
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
    const { hostname, pathname } = parsedUrl

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

  // Check if this is a zip file (binary data) or SSE file (text/event-stream)
  const contentType = mockResponse.headers['content-type'] || mockResponse.headers['Content-Type']
  const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
  // Check for ZIP magic bytes (PK - ZIP file signature)
  const hasZipMagicBytes = Buffer.isBuffer(bodyBuffer) && bodyBuffer.length >= 2 && bodyBuffer[0] === 0x50 && bodyBuffer[1] === 0x4b
  const isZipFile = contentTypeStr.includes('application/zip') || hasZipMagicBytes
  const isSseFile = contentTypeStr.includes('text/event-stream')

  if (isZipFile) {
    console.log(
      `[Proxy] Detected zip file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}, Has magic bytes: ${hasZipMagicBytes}`,
    )
  }
  if (isSseFile) {
    console.log(`[Proxy] Detected SSE file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}`)
  }

  // Convert headers to the format expected by writeHead and check for existing CORS headers
  const headers: Record<string, string> = {}
  const lowerCaseHeaders: Set<string> = new Set()

  for (const [key, value] of Object.entries(mockResponse.headers)) {
    const lowerKey = key.toLowerCase()
    // Skip Content-Length headers (case-insensitive) - we'll set it below
    // Skip Transfer-Encoding headers - we'll set Content-Length instead
    // Skip Content-Encoding headers - mock body is already decompressed, so we can't send gzip encoding
    // Skip Content-Encoding and Transfer-Encoding headers for zip files and SSE files - data is not encoded
    if (
      lowerKey !== 'content-length' &&
      lowerKey !== 'transfer-encoding' &&
      lowerKey !== 'content-encoding' &&
      !((isZipFile || isSseFile) && lowerKey === 'content-encoding')
    ) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
      lowerCaseHeaders.add(lowerKey)
    }
  }

  // Double-check: explicitly remove Content-Encoding and Transfer-Encoding for zip files and SSE files
  if (isZipFile || isSseFile) {
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
    const fileType = isZipFile ? 'zip file' : 'SSE file'
    console.log(`[Proxy] sendMockResponse - Final headers for ${fileType} (after cleanup):`, Object.keys(headers))
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

  // Explicitly remove Transfer-Encoding and Content-Encoding headers if they somehow got through
  // (case-insensitive check) - we're setting Content-Length, so Transfer-Encoding can't be present
  // Content-Encoding is removed because mock body is already decompressed
  for (const key of Object.keys(headers)) {
    const lowerKey = key.toLowerCase()
    if (lowerKey === 'transfer-encoding' || lowerKey === 'content-encoding') {
      delete headers[key]
      lowerCaseHeaders.delete(lowerKey)
    }
  }

  // Always set Content-Length to match actual body length
  headers['Content-Length'] = String(bodyBuffer.length)

  res.writeHead(mockResponse.statusCode, headers)
  res.end(bodyBuffer)
}

export { type MockResponse } from '../MockResponse/MockResponse.ts'
