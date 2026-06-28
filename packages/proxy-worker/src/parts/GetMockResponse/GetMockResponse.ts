import type { ServerResponse } from 'node:http'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import type { MockResponse } from '../MockResponse/MockResponse.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import * as GetProxyPaths from '../GetProxyPaths/GetProxyPaths.ts'
import * as IsExpiredTokenErrorResponse from '../IsExpiredTokenErrorResponse/IsExpiredTokenErrorResponse.ts'
import * as LoadZipData from '../LoadZipData/LoadZipData.ts'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'
import * as ReplaceJwtTokensInValue from '../ReplaceJwtTokensInValue/ReplaceJwtTokensInValue.ts'
import * as RequestMockKey from '../RequestMockKey/RequestMockKey.ts'

const isCopilotMockKeyedRequest = (hostname: string, pathname: string, method: string): boolean => {
  const normalizedMethod = method.toUpperCase()
  if (normalizedMethod !== 'POST') {
    return false
  }
  if (pathname !== '/chat/completions' && pathname !== '/responses') {
    return false
  }
  return hostname === 'api.githubcopilot.com' || hostname === 'api.individual.githubcopilot.com'
}

const getSignedCopilotTokenExpiration = (token: string): number | undefined => {
  const normalizedToken = token.startsWith('Bearer ') ? token.slice('Bearer '.length) : token
  if (!normalizedToken.startsWith('tid=')) {
    return undefined
  }
  const expirationPart = normalizedToken.split(';').find((part) => part.startsWith('exp='))
  if (!expirationPart) {
    return undefined
  }
  const expiration = Number(expirationPart.slice('exp='.length))
  return Number.isFinite(expiration) ? expiration : undefined
}

const isExpiredSignedCopilotTokenPayload = (body: unknown): boolean => {
  if (!body || typeof body !== 'object') {
    return false
  }
  const { token } = body as { token?: unknown }
  const expiresAt = (body as { expires_at?: unknown }).expires_at
  const expiration = typeof token === 'string' ? getSignedCopilotTokenExpiration(token) : undefined
  const fallbackExpiration = typeof expiresAt === 'number' ? expiresAt : undefined
  const effectiveExpiration = expiration ?? fallbackExpiration
  if (effectiveExpiration === undefined) {
    return false
  }
  return effectiveExpiration <= Math.floor(Date.now() / 1000)
}

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

    if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(response)) {
      return null
    }

    if (isExpiredSignedCopilotTokenPayload(response.body)) {
      return null
    }

    // Handle OPTIONS requests specially - they might have empty body
    if (response.statusCode === 204) {
      return {
        body: '',
        headers: response.headers,
        statusCode: response.statusCode,
      }
    }

    // Handle file references (for zip files, SSE files, images, etc.)
    let { body } = response
    let isZipFile = false
    let isSseFile = false
    let isImageFile = false

    if (typeof body === 'string' && body.startsWith('file-reference:')) {
      const fileData = await LoadZipData.loadZipData(body)
      if (fileData) {
        body = fileData
        // Determine file type from responseType or content type
        switch (responseType) {
          case 'binary': {
            // Check if it's an image based on content type
            const contentType = response.headers['content-type'] || response.headers['Content-Type']
            const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
            if (contentTypeStr.startsWith('image/')) {
              isImageFile = true
            }

            break
          }
          case 'sse': {
            isSseFile = true

            break
          }
          case 'zip': {
            isZipFile = true

            break
          }
          default: {
            // Fallback to content type check
            const contentType = response.headers['content-type'] || response.headers['Content-Type']
            const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
            if (contentTypeStr.includes('application/zip')) {
              isZipFile = true
            } else if (contentTypeStr.includes('text/event-stream')) {
              isSseFile = true
            } else if (contentTypeStr.startsWith('image/')) {
              isImageFile = true
            }
          }
        }
      }
    }

    if (Buffer.isBuffer(body) && isSseFile) {
      body = PathPlaceholders.restoreAbsolutePathsFromPlaceholdersInBuffer(body)
    }

    if (!Buffer.isBuffer(body)) {
      body = PathPlaceholders.restoreAbsolutePathsFromPlaceholdersInValue(await ReplaceJwtTokensInValue.replaceJwtTokensInValue(body))
    }

    if (responseType === 'json' && typeof body === 'object') {
      // If responseType is json and body is already an object, stringify it
      body = JSON.stringify(body)
    } else
      switch (responseType) {
        case 'binary': {
          // Check if it's an image based on content type
          const contentType = response.headers['content-type'] || response.headers['Content-Type']
          const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
          if (contentTypeStr.startsWith('image/')) {
            isImageFile = true
          }

          break
        }
        case 'sse': {
          isSseFile = true

          break
        }
        case 'zip': {
          isZipFile = true

          break
        }
        default: {
          // Fallback: check content type
          const contentType = response.headers['content-type'] || response.headers['Content-Type']
          const contentTypeStr = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''
          if (contentTypeStr.includes('application/zip')) {
            isZipFile = true
          } else if (contentTypeStr.includes('text/event-stream')) {
            isSseFile = true
          } else if (contentTypeStr.startsWith('image/')) {
            isImageFile = true
          }
        }
      }

    // Remove Content-Encoding and Transfer-Encoding headers for zip files, SSE files, and images
    // since the binary/text data is not encoded
    const cleanedHeaders = { ...response.headers }
    if (isZipFile || isSseFile || isImageFile) {
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

const getResponsesInputItems = (requestBody: unknown): readonly unknown[] => {
  if (!requestBody || typeof requestBody !== 'object') {
    return []
  }
  const { input } = requestBody as { input?: unknown }
  return Array.isArray(input) ? input : []
}

const getResponsesRequestShape = (requestBody: unknown) => {
  const inputItems = getResponsesInputItems(requestBody)
  let functionCallOutputCount = 0
  let assistantMessageCount = 0

  for (const item of inputItems) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const typedItem = item as { type?: unknown; role?: unknown }
    if (typedItem.type === 'function_call_output') {
      functionCallOutputCount += 1
    }
    if (typedItem.role === 'assistant') {
      assistantMessageCount += 1
    }
  }

  return {
    assistantMessageCount,
    functionCallOutputCount,
    inputItemCount: inputItems.length,
    serializedInputLength: JSON.stringify(inputItems).length,
  }
}

const compareResponsesRequestShape = (requestedRequestBody: unknown, candidateRequestBody: unknown): readonly number[] => {
  const requestedShape = getResponsesRequestShape(requestedRequestBody)
  const candidateShape = getResponsesRequestShape(candidateRequestBody)

  return [
    Math.abs(requestedShape.inputItemCount - candidateShape.inputItemCount),
    Math.abs(requestedShape.functionCallOutputCount - candidateShape.functionCallOutputCount),
    Math.abs(requestedShape.assistantMessageCount - candidateShape.assistantMessageCount),
    Math.abs(requestedShape.serializedInputLength - candidateShape.serializedInputLength),
  ]
}

const getChatCompletionsMessages = (requestBody: unknown): readonly unknown[] => {
  if (!requestBody || typeof requestBody !== 'object') {
    return []
  }
  const { messages } = requestBody as { messages?: unknown }
  return Array.isArray(messages) ? messages : []
}

const getChatCompletionsRequestShape = (requestBody: unknown) => {
  const messages = getChatCompletionsMessages(requestBody)
  let toolMessageCount = 0
  let assistantMessageCount = 0
  let toolCallCount = 0

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      continue
    }
    const typedMessage = message as { role?: unknown; tool_calls?: unknown }
    if (typedMessage.role === 'assistant') {
      assistantMessageCount += 1
    }
    if (typedMessage.role === 'tool' || typedMessage.role === 'function') {
      toolMessageCount += 1
    }
    if (Array.isArray(typedMessage.tool_calls)) {
      toolCallCount += typedMessage.tool_calls.length
    }
  }

  return {
    assistantMessageCount,
    messageCount: messages.length,
    serializedMessagesLength: JSON.stringify(messages).length,
    toolCallCount,
    toolMessageCount,
  }
}

const compareChatCompletionsRequestShape = (requestedRequestBody: unknown, candidateRequestBody: unknown): readonly number[] => {
  const requestedShape = getChatCompletionsRequestShape(requestedRequestBody)
  const candidateShape = getChatCompletionsRequestShape(candidateRequestBody)

  return [
    Math.abs(requestedShape.messageCount - candidateShape.messageCount),
    Math.abs(requestedShape.toolCallCount - candidateShape.toolCallCount),
    Math.abs(requestedShape.toolMessageCount - candidateShape.toolMessageCount),
    Math.abs(requestedShape.assistantMessageCount - candidateShape.assistantMessageCount),
    Math.abs(requestedShape.serializedMessagesLength - candidateShape.serializedMessagesLength),
  ]
}

const findBestChatCompletionsShapeMatch = async (
  mockRequestsDir: string,
  baseMockFileName: string,
  requestBody: unknown,
): Promise<string | null> => {
  const basePrefix = baseMockFileName.replace(/\.json$/, '')
  const files = await readdir(mockRequestsDir)
  const candidateFiles = files
    .filter((file) => file.startsWith(`${basePrefix}_`) && file.endsWith('.json'))
    .sort((first, second) => first.localeCompare(second))

  let bestCandidateFile: string | null = null
  let bestCandidateDistance: readonly number[] | undefined

  for (const candidateFile of candidateFiles) {
    try {
      const candidatePath = join(mockRequestsDir, candidateFile)
      const mockData = JSON.parse(await readFile(candidatePath, 'utf8'))
      if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(mockData.response)) {
        continue
      }
      const candidateRequestBody = mockData.request?.body
      const candidateDistance = compareChatCompletionsRequestShape(requestBody, candidateRequestBody)
      if (isBetterResponsesRequestShapeMatch(candidateDistance, bestCandidateDistance)) {
        bestCandidateDistance = candidateDistance
        bestCandidateFile = candidateFile
      }
    } catch (error) {
      console.error(`[Proxy] Error checking compatible mock file ${candidateFile}:`, error)
    }
  }

  return bestCandidateFile
}

const isBetterResponsesRequestShapeMatch = (
  candidateDistance: readonly number[],
  bestCandidateDistance: readonly number[] | undefined,
): boolean => {
  if (!bestCandidateDistance) {
    return true
  }

  for (let index = 0; index < candidateDistance.length; index += 1) {
    if (candidateDistance[index] < bestCandidateDistance[index]) {
      return true
    }
    if (candidateDistance[index] > bestCandidateDistance[index]) {
      return false
    }
  }

  return false
}

const findCompatibleCopilotMockFile = async (
  mockRequestsDir: string,
  hostname: string,
  pathname: string,
  method: string,
  requestBody: unknown,
  baseMockFileName: string,
): Promise<string | null> => {
  if (!existsSync(mockRequestsDir)) {
    return null
  }

  const requestedMockKey = RequestMockKey.getRequestMockKey(hostname, pathname, method, requestBody)
  const requestedRelaxedMockKey = RequestMockKey.getRelaxedRequestMockKey(hostname, pathname, method, requestBody)
  const requestedUserRequestMockKey =
    pathname === '/responses' || pathname === '/chat/completions'
      ? RequestMockKey.getUserRequestMockKey(hostname, pathname, method, requestBody)
      : undefined
  if (!requestedMockKey && !requestedRelaxedMockKey && !requestedUserRequestMockKey) {
    return null
  }

  const basePrefix = baseMockFileName.replace(/\.json$/, '')
  const files = await readdir(mockRequestsDir)
  const candidateFiles = files
    .filter((file) => file.startsWith(`${basePrefix}_`) && file.endsWith('.json'))
    .sort((first, second) => first.localeCompare(second))

  for (const candidateFile of candidateFiles) {
    try {
      const candidatePath = join(mockRequestsDir, candidateFile)
      const mockData = JSON.parse(await readFile(candidatePath, 'utf8'))
      if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(mockData.response)) {
        continue
      }
      const candidateRequestBody = mockData.request?.body
      const candidateMockKey = RequestMockKey.getRequestMockKey(hostname, pathname, method, candidateRequestBody)
      if (requestedMockKey && candidateMockKey === requestedMockKey) {
        return candidateFile
      }
    } catch (error) {
      console.error(`[Proxy] Error checking compatible mock file ${candidateFile}:`, error)
    }
  }

  for (const candidateFile of candidateFiles) {
    try {
      const candidatePath = join(mockRequestsDir, candidateFile)
      const mockData = JSON.parse(await readFile(candidatePath, 'utf8'))
      if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(mockData.response)) {
        continue
      }
      const candidateRequestBody = mockData.request?.body
      const candidateRelaxedMockKey = RequestMockKey.getRelaxedRequestMockKey(hostname, pathname, method, candidateRequestBody)
      if (requestedRelaxedMockKey && candidateRelaxedMockKey === requestedRelaxedMockKey) {
        return candidateFile
      }
    } catch (error) {
      console.error(`[Proxy] Error checking compatible mock file ${candidateFile}:`, error)
    }
  }

  if (requestedUserRequestMockKey) {
    let bestCandidateFile: string | null = null
    let bestCandidateDistance: readonly number[] | undefined

    for (const candidateFile of candidateFiles) {
      try {
        const candidatePath = join(mockRequestsDir, candidateFile)
        const mockData = JSON.parse(await readFile(candidatePath, 'utf8'))
        if (IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse(mockData.response)) {
          continue
        }
        const candidateRequestBody = mockData.request?.body
        const candidateUserRequestMockKey = RequestMockKey.getUserRequestMockKey(hostname, pathname, method, candidateRequestBody)
        const isMatchingUserRequest = candidateUserRequestMockKey === requestedUserRequestMockKey
        const shouldCompareCandidate = pathname === '/responses' ? true : isMatchingUserRequest
        if (shouldCompareCandidate) {
          const candidateDistance =
            pathname === '/chat/completions'
              ? compareChatCompletionsRequestShape(requestBody, candidateRequestBody)
              : compareResponsesRequestShape(requestBody, candidateRequestBody)
          if (isBetterResponsesRequestShapeMatch(candidateDistance, bestCandidateDistance)) {
            bestCandidateDistance = candidateDistance
            bestCandidateFile = candidateFile
          }
        }
      } catch (error) {
        console.error(`[Proxy] Error checking compatible mock file ${candidateFile}:`, error)
      }
    }

    if (bestCandidateFile) {
      return bestCandidateFile
    }
  }

  return null
}

export const getMockResponse = async (method: string, url: string, requestBody?: unknown): Promise<MockResponse | null> => {
  try {
    const scopedMockRequestsDir = GetProxyPaths.getMockRequestsDir()
    const sharedMockRequestsDir = GetProxyPaths.getSharedMockRequestsDir()
    const mockRequestsDirs =
      scopedMockRequestsDir === sharedMockRequestsDir ? [scopedMockRequestsDir] : [scopedMockRequestsDir, sharedMockRequestsDir]
    const parsedUrl = new URL(url)
    const { hostname, pathname } = parsedUrl

    // Handle OPTIONS preflight requests - return a proper CORS preflight response
    if (method === 'OPTIONS') {
      const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method)
      for (const mockRequestsDir of mockRequestsDirs) {
        const mockFile = join(mockRequestsDir, mockFileName)
        const mockResponse = await loadMockResponse(mockFile)

        if (mockResponse) {
          return mockResponse
        }
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
    const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method, requestBody)
    if (pathname === '/chat/completions') {
      console.log(`[Proxy] Requested mock file ${mockFileName} for ${method} ${pathname}`)
    }
    for (const mockRequestsDir of mockRequestsDirs) {
      const mockFile = join(mockRequestsDir, mockFileName)
      const mockResponse = await loadMockResponse(mockFile)

      if (mockResponse) {
        console.log(`[Proxy] Loaded mock file ${mockFileName} for ${method} ${pathname}`)
        return mockResponse
      }

      if (pathname === '/chat/completions' && requestBody !== undefined && existsSync(mockFile)) {
        const baseMockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method)
        const shapeMatchFileName = await findBestChatCompletionsShapeMatch(mockRequestsDir, baseMockFileName, requestBody)
        if (shapeMatchFileName) {
          const shapeMatchFile = join(mockRequestsDir, shapeMatchFileName)
          const shapeMatchResponse = await loadMockResponse(shapeMatchFile)
          if (shapeMatchResponse) {
            console.log(`[Proxy] Loaded shape-matched mock file ${shapeMatchFileName} for ${method} ${pathname}`)
            return shapeMatchResponse
          }
        }
      }

      if (requestBody !== undefined) {
        const fallbackMockFileName = await GetMockFileName.getMockFileName(hostname, pathname, method)
        const compatibleMockFileName = await findCompatibleCopilotMockFile(
          mockRequestsDir,
          hostname,
          pathname,
          method,
          requestBody,
          fallbackMockFileName,
        )
        if (compatibleMockFileName) {
          const compatibleMockFile = join(mockRequestsDir, compatibleMockFileName)
          const compatibleMockResponse = await loadMockResponse(compatibleMockFile)
          if (compatibleMockResponse) {
            console.log(`[Proxy] Loaded compatible mock file ${compatibleMockFileName} for ${method} ${pathname}`)
            return compatibleMockResponse
          }
        }

        if (!isCopilotMockKeyedRequest(hostname, pathname, method) && fallbackMockFileName !== mockFileName) {
          const fallbackMockFile = join(mockRequestsDir, fallbackMockFileName)
          const fallbackMockResponse = await loadMockResponse(fallbackMockFile)
          if (fallbackMockResponse) {
            console.log(`[Proxy] Loaded fallback mock file ${fallbackMockFileName} for ${method} ${pathname}`)
            return fallbackMockResponse
          }
        }
      }
    }

    if (requestBody !== undefined && isCopilotMockKeyedRequest(hostname, pathname, method)) {
      console.log(`[Proxy] No compatible keyed mock file found for ${method} ${pathname}; skipping generic fallback`)
      return null
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
  const isImageFile = contentTypeStr.startsWith('image/')

  if (isZipFile) {
    console.log(
      `[Proxy] Detected zip file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}, Has magic bytes: ${hasZipMagicBytes}`,
    )
  }
  if (isSseFile) {
    console.log(`[Proxy] Detected SSE file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}`)
  }
  if (isImageFile) {
    console.log(`[Proxy] Detected image file - removing Content-Encoding/Transfer-Encoding headers. Content-Type: ${contentTypeStr}`)
  }

  // Convert headers to the format expected by writeHead and check for existing CORS headers
  const headers: Record<string, string> = {}
  const lowerCaseHeaders: Set<string> = new Set()

  for (const [key, value] of Object.entries(mockResponse.headers)) {
    const lowerKey = key.toLowerCase()
    // Skip Content-Length headers (case-insensitive) - we'll set it below
    // Skip Transfer-Encoding headers - we'll set Content-Length instead
    // Skip Content-Encoding headers - mock body is already decompressed, so we can't send gzip encoding
    // Skip Content-Encoding and Transfer-Encoding headers for zip files, SSE files, and images - data is not encoded
    if (
      lowerKey !== 'content-length' &&
      lowerKey !== 'transfer-encoding' &&
      lowerKey !== 'content-encoding' &&
      !((isZipFile || isSseFile || isImageFile) && lowerKey === 'content-encoding')
    ) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value
      lowerCaseHeaders.add(lowerKey)
    }
  }

  // Double-check: explicitly remove Content-Encoding and Transfer-Encoding for zip files, SSE files, and images
  if (isZipFile || isSseFile || isImageFile) {
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
    const fileType = isZipFile ? 'zip file' : isSseFile ? 'SSE file' : 'image file'
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
