import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveSseData from '../SaveSseData/SaveSseData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'

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
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const filename = `${timestamp}_POST_${SanitizeFilename.sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

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
    let responseBodyData: string | object | undefined

    if (responseData) {
      const responseContentEncoding = responseData.responseHeaders['content-encoding'] || responseData.responseHeaders['Content-Encoding']
      const responseContentType = responseData.responseHeaders['content-type'] || responseData.responseHeaders['Content-Type']
      const responseContentTypeLower = responseContentType
        ? (Array.isArray(responseContentType) ? responseContentType[0] : responseContentType).toLowerCase()
        : ''

      if (responseContentTypeLower.includes('application/zip')) {
        responseType = 'zip'
        const zipFilePath = await SaveZipData.saveZipData(responseData.responseData, url, timestamp)
        responseBodyData = `file-reference:${zipFilePath}`
      } else if (responseContentTypeLower.includes('text/event-stream')) {
        responseType = 'sse'
        const sseFilePath = await SaveSseData.saveSseData(responseData.responseData, url, timestamp)
        responseBodyData = `file-reference:${sseFilePath}`
      } else {
        const compressionWorker = await CompressionWorker.getCompressionWorker()
        const result = await compressionWorker.invoke('Compression.decompressBody', responseData.responseData, responseContentEncoding)
        const decompressedBody = result.body

        // Handle case where decompressedBody is an array of numbers (from RPC serialization)
        let bodyString: string
        if (Array.isArray(decompressedBody)) {
          bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
        } else {
          bodyString = decompressedBody
        }

        // Check if it's JSON
        if (responseContentTypeLower.includes('application/json') || responseContentTypeLower.includes('text/json')) {
          try {
            responseType = 'json'
            responseBodyData = JSON.parse(bodyString)
          } catch {
            // If parsing fails, treat as text
            responseType = 'text'
            responseBodyData = bodyString
          }
        } else {
          responseType = 'text'
          responseBodyData = bodyString
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
