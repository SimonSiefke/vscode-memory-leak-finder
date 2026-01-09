import type { IncomingMessage } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import * as HashRequestBody from '../HashRequestBody/HashRequestBody.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveImageData from '../SaveImageData/SaveImageData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'
import * as SetCurrentTestName from '../SetCurrentTestName/SetCurrentTestName.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

export const saveRequest = async (
  req: IncomingMessage,
  statusCode: number,
  statusMessage: string | undefined,
  responseHeaders: Record<string, string | string[]>,
  responseData: Buffer,
  requestBody?: Buffer,
): Promise<void> => {
  try {
    const currentTestName = SetCurrentTestName.getCurrentTestName()
    if (!currentTestName) {
      console.log(`[SaveRequest] WARNING: No test name set when saving request for ${req.method} ${req.url}`)
    } else {
      console.log(`[SaveRequest] Test name is set to: ${currentTestName} for ${req.method} ${req.url}`)
    }
    const testSpecificDir = currentTestName ? join(REQUESTS_DIR, SanitizeFilename.sanitizeFilename(currentTestName)) : REQUESTS_DIR
    console.log(`[SaveRequest] Will save to directory: ${testSpecificDir}`)
    await mkdir(testSpecificDir, { recursive: true })
    const timestamp = Date.now()
    const url = req.url || ''

    // Include body hash in filename for POST/PUT/PATCH requests
    let bodyHash: string | undefined
    let requestBodyData: any
    if (requestBody && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      bodyHash = HashRequestBody.hashRequestBody(requestBody)
      // Try to parse as JSON, otherwise keep as string
      try {
        requestBodyData = JSON.parse(requestBody.toString('utf8'))
      } catch {
        requestBodyData = requestBody.toString('utf8')
      }
    }

    const hashSuffix = bodyHash ? `_${bodyHash}` : ''
    const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}${hashSuffix}.json`
    const filepath = join(testSpecificDir, filename)

    const contentEncoding = responseHeaders['content-encoding'] || responseHeaders['Content-Encoding']
    const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type']
    const contentTypeLower = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''

    // Determine response type and process body accordingly
    let responseType: 'json' | 'zip' | 'binary' | 'text' | 'sse'
    let responseBodyData: string | object | string[]

    if (contentTypeLower.includes('application/zip')) {
      responseType = 'zip'
      const zipFilePath = await SaveZipData.saveZipData(responseData, url, timestamp, currentTestName || undefined)
      responseBodyData = `file-reference:${zipFilePath}`
    } else if (contentTypeLower.includes('text/event-stream')) {
      responseType = 'sse'
      // Decompress if needed before saving
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseData, contentEncoding)
      const decompressedBody = result.body

      // Handle Uint8Array (which may be serialized as an array through IPC)
      let bodyString: string
      if (decompressedBody instanceof Uint8Array) {
        bodyString = new TextDecoder().decode(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        // Handle case where Uint8Array was serialized as an array through IPC
        bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        // Convert object like {"0": 123, "1": 10, ...} to Uint8Array
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          // Looks like a serialized Buffer/Uint8Array
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          bodyString = new TextDecoder().decode(new Uint8Array(numbers))
        } else {
          // Not a serialized buffer, treat as string
          bodyString = String(decompressedBody)
        }
      } else {
        bodyString = String(decompressedBody)
      }

      // Save SSE as array of strings, separated by newlines
      responseBodyData = bodyString.split('\n')
    } else if (contentTypeLower.startsWith('image/')) {
      responseType = 'binary'
      // Decompress if needed before saving
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseData, contentEncoding)
      const decompressedBody = result.body

      // Convert decompressed body to Buffer
      let imageBuffer: Buffer
      if (decompressedBody instanceof Uint8Array) {
        imageBuffer = Buffer.from(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        imageBuffer = Buffer.from(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          imageBuffer = Buffer.from(new Uint8Array(numbers))
        } else {
          imageBuffer = Buffer.from(String(decompressedBody))
        }
      } else {
        imageBuffer = Buffer.from(String(decompressedBody))
      }

      const imageFilePath = await SaveImageData.saveImageData(imageBuffer, url, timestamp, contentTypeLower)
      responseBodyData = `file-reference:${imageFilePath}`
    } else {
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseData, contentEncoding)
      const decompressedBody = result.body

      // Handle Uint8Array (which may be serialized as an array through IPC)
      let bodyString: string
      if (decompressedBody instanceof Uint8Array) {
        bodyString = new TextDecoder().decode(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        // Handle case where Uint8Array was serialized as an array through IPC
        bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        // Convert object like {"0": 123, "1": 10, ...} to Uint8Array
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          // Looks like a serialized Buffer/Uint8Array
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          bodyString = new TextDecoder().decode(new Uint8Array(numbers))
        } else {
          // Not a serialized buffer, treat as string
          bodyString = String(decompressedBody)
        }
      } else {
        bodyString = String(decompressedBody)
      }

      // Check if it's JSON
      if (contentTypeLower.includes('application/json') || contentTypeLower.includes('text/json')) {
        try {
          responseType = 'json'
          responseBodyData = JSON.parse(bodyString)
        } catch {
          // If parsing fails, treat as text
          responseType = 'text'
          // Save plaintext as array of strings, separated by newlines
          responseBodyData = bodyString.split('\n')
        }
      } else {
        responseType = 'text'
        // Save plaintext as array of strings, separated by newlines
        responseBodyData = bodyString.split('\n')
      }
    }

    const requestData = {
      metadata: {
        responseType,
        timestamp,
      },
      request: {
        headers: req.headers,
        method: req.method,
        url: req.url,
        ...(requestBodyData !== undefined && { body: requestBodyData }),
      },
      response: {
        body: responseBodyData,
        headers: responseHeaders,
        statusCode,
        statusMessage,
      },
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved request to ${filepath}`)
  } catch (error) {
    // Ignore errors when saving requests
    console.error('[Proxy] Failed to save request:', error)
  }
}
