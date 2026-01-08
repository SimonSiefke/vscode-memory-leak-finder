import type { IncomingMessage } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveSseData from '../SaveSseData/SaveSseData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

export const saveRequest = async (
  req: IncomingMessage,
  statusCode: number,
  statusMessage: string | undefined,
  responseHeaders: Record<string, string | string[]>,
  responseData: Buffer,
): Promise<void> => {
  try {
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const url = req.url || ''
    const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const contentEncoding = responseHeaders['content-encoding'] || responseHeaders['Content-Encoding']
    const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type']
    const contentTypeLower = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''

    // Determine response type and process body accordingly
    let responseType: 'json' | 'zip' | 'binary' | 'text' | 'sse'
    let responseBodyData: string | object

    if (contentTypeLower.includes('application/zip')) {
      responseType = 'zip'
      const zipFilePath = await SaveZipData.saveZipData(responseData, url, timestamp)
      responseBodyData = `file-reference:${zipFilePath}`
    } else if (contentTypeLower.includes('text/event-stream')) {
      responseType = 'sse'
      const sseFilePath = await SaveSseData.saveSseData(responseData, url, timestamp)
      responseBodyData = `file-reference:${sseFilePath}`
    } else {
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseData, contentEncoding)
      const decompressedBody = result.body

      // Handle case where decompressedBody is an array of numbers (from RPC serialization)
      let bodyString: string
      if (Array.isArray(decompressedBody)) {
        bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
      } else {
        bodyString = decompressedBody
      }

      // Check if it's JSON
      if (contentTypeLower.includes('application/json') || contentTypeLower.includes('text/json')) {
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

    const requestData = {
      metadata: {
        responseType,
        timestamp,
      },
      request: {
        headers: req.headers,
        method: req.method,
        url: req.url,
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
