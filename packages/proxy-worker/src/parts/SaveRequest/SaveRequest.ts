import { mkdir, writeFile } from 'fs/promises'
import type { IncomingMessage } from 'http'
import { join } from 'path'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveSseData from '../SaveSseData/SaveSseData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const parseJsonIfApplicable = (body: string, contentType: string | string[] | undefined): string | object => {
  if (!contentType) {
    return body
  }

  const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType
  const normalizedContentType = contentTypeStr.toLowerCase().trim()

  // Check if content type is JSON
  if (normalizedContentType.includes('application/json') || normalizedContentType.includes('text/json')) {
    try {
      return JSON.parse(body)
    } catch {
      // If parsing fails, return as string
      return body
    }
  }

  return body
}

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

    // Handle zip files separately - don't decompress them
    // Handle SSE (Server-Sent Events) separately - save as text file
    let parsedBody: any
    let wasCompressed = false
    if (contentTypeLower.includes('application/zip')) {
      const zipFilePath = await SaveZipData.saveZipData(responseData, url, timestamp)
      parsedBody = `file-reference:${zipFilePath}`
    } else if (contentTypeLower.includes('text/event-stream')) {
      const sseFilePath = await SaveSseData.saveSseData(responseData, url, timestamp)
      parsedBody = `file-reference:${sseFilePath}`
    } else {
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseData, contentEncoding)
      const decompressedBody = result.body
      wasCompressed = result.wasCompressed
      parsedBody = parseJsonIfApplicable(decompressedBody, contentType)
    }

    const requestData = {
      headers: req.headers,
      method: req.method,
      response: {
        body: parsedBody,
        headers: responseHeaders,
        statusCode,
        statusMessage,
        wasCompressed,
      },
      timestamp,
      url: req.url,
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved request to ${filepath}`)
  } catch (error) {
    // Ignore errors when saving requests
    console.error('[Proxy] Failed to save request:', error)
  }
}
