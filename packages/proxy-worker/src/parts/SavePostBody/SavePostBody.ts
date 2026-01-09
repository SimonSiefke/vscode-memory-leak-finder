import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveImageData from '../SaveImageData/SaveImageData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'
import * as SetCurrentTestName from '../SetCurrentTestName/SetCurrentTestName.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

export const savePostBody = async (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: Buffer,
  responseData?: {
    statusCode: number
    statusMessage: string | undefined
    responseHeaders: Record<string, string | string[]>
    responseData: Buffer
  },
): Promise<void> => {
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return
  }

  try {
    const currentTestName = SetCurrentTestName.getCurrentTestName()
    const testSpecificDir = currentTestName ? join(REQUESTS_DIR, SanitizeFilename.sanitizeFilename(currentTestName)) : REQUESTS_DIR
    await mkdir(testSpecificDir, { recursive: true })
    const timestamp = Date.now()
    const filename = `${timestamp}_${method}_${SanitizeFilename.sanitizeFilename(url)}.json`
    const filepath = join(testSpecificDir, filename)

    const contentType = headers['content-type'] || headers['Content-Type'] || ''
    const contentTypeLower = contentType.toLowerCase()

    // Parse request body
    let requestBodyData: string | object = body.toString('utf8')
    if (contentTypeLower.includes('application/json')) {
      try {
        requestBodyData = JSON.parse(requestBodyData)
      } catch {
        // Keep as string if parsing fails
      }
    } else if (contentTypeLower.includes('application/x-www-form-urlencoded')) {
      try {
        const formData: Record<string, string> = {}
        const params = new URLSearchParams(requestBodyData as string)
        for (const [key, value] of params.entries()) {
          formData[key] = value
        }
        requestBodyData = formData
      } catch {
        // Keep as string if parsing fails
      }
    }

    // Process response data if available
    let responseType: 'json' | 'zip' | 'binary' | 'text' | 'sse' | undefined
    let responseBodyData: string | object | string[] | undefined

    if (responseData) {
      const responseContentEncoding = responseData.responseHeaders['content-encoding'] || responseData.responseHeaders['Content-Encoding']
      const responseContentType = responseData.responseHeaders['content-type'] || responseData.responseHeaders['Content-Type']
      const responseContentTypeLower = responseContentType
        ? (Array.isArray(responseContentType) ? responseContentType[0] : responseContentType).toLowerCase()
        : ''

      if (responseContentTypeLower.includes('application/zip')) {
        responseType = 'zip'
        const zipFilePath = await SaveZipData.saveZipData(responseData.responseData, url, timestamp, currentTestName || undefined)
        responseBodyData = `file-reference:${zipFilePath}`
      } else if (responseContentTypeLower.includes('text/event-stream')) {
        responseType = 'sse'
        // Decompress if needed before saving
        const compressionWorker = await CompressionWorker.getCompressionWorker()
        const result = await compressionWorker.invoke('Compression.decompressBody', responseData.responseData, responseContentEncoding)
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
      } else if (responseContentTypeLower.startsWith('image/')) {
        responseType = 'binary'
        // Decompress if needed before saving
        const compressionWorker = await CompressionWorker.getCompressionWorker()
        const result = await compressionWorker.invoke('Compression.decompressBody', responseData.responseData, responseContentEncoding)
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

        const imageFilePath = await SaveImageData.saveImageData(imageBuffer, url, timestamp, responseContentTypeLower)
        responseBodyData = `file-reference:${imageFilePath}`
      } else {
        const compressionWorker = await CompressionWorker.getCompressionWorker()
        const result = await compressionWorker.invoke('Compression.decompressBody', responseData.responseData, responseContentEncoding)
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
        if (responseContentTypeLower.includes('application/json') || responseContentTypeLower.includes('text/json')) {
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
    }

    const requestData = {
      metadata: {
        responseType: responseType || 'text',
        timestamp,
      },
      request: {
        body: requestBodyData,
        headers,
        method,
        url,
      },
      response: responseData
        ? {
            body: responseBodyData,
            headers: responseData.responseHeaders,
            statusCode: responseData.statusCode,
            statusMessage: responseData.statusMessage,
          }
        : undefined,
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved POST body to ${filepath}`)
  } catch (error) {
    console.error('[Proxy] Failed to save POST body:', error)
  }
}
