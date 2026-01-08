import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { parseJsonIfApplicable } from '../HttpProxyServer/HttpProxyServer.ts'
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

    let parsedBody: any = body.toString('utf8')
    let bodyFormat = 'text'

    // Handle zip files separately
    if (contentTypeLower.includes('application/zip')) {
      const zipFilePath = await SaveZipData.saveZipData(body, url, timestamp)
      parsedBody = `file-reference:${zipFilePath}`
      bodyFormat = 'zip'
    }
    // Try to parse JSON
    else if (contentTypeLower.includes('application/json')) {
      try {
        parsedBody = JSON.parse(parsedBody)
        bodyFormat = 'json'
      } catch {
        // Keep as string if parsing fails
      }
    }
    // Try to parse form data
    else if (contentTypeLower.includes('application/x-www-form-urlencoded')) {
      try {
        const formData: Record<string, string> = {}
        const params = new URLSearchParams(parsedBody)
        for (const [key, value] of params.entries()) {
          formData[key] = value
        }
        parsedBody = formData
        bodyFormat = 'form-urlencoded'
      } catch {
        // Keep as string if parsing fails
      }
    }
    // Try to parse multipart form data (basic parsing)
    else if (contentTypeLower.includes('multipart/form-data')) {
      bodyFormat = 'multipart-form-data'
      // For multipart, we'll save the raw body as it's complex to parse
    }

    const postData: any = {
    const postData = {
      body: parsedBody,
      bodyFormat,
      contentType,
      headers,
      method,
      rawBody: bodyFormat === 'zip' ? undefined : body.toString('utf8'),
      timestamp,
      url,
    }

    // Add response data if available
    if (responseData) {
      const responseContentEncoding = responseData.responseHeaders['content-encoding'] || responseData.responseHeaders['Content-Encoding']
      const responseContentType = responseData.responseHeaders['content-type'] || responseData.responseHeaders['Content-Type']
      const responseContentTypeLower = responseContentType
        ? (Array.isArray(responseContentType) ? responseContentType[0] : responseContentType).toLowerCase()
        : ''

      let parsedResponseBody: any
      let responseWasCompressed = false
      let responseBodyFormat = 'text'

      // Handle zip files separately - don't decompress them
      // Handle SSE (Server-Sent Events) separately - save as text file
      if (responseContentTypeLower.includes('application/zip')) {
        const zipFilePath = await SaveZipData.saveZipData(responseData.responseData, url, timestamp)
        parsedResponseBody = `file-reference:${zipFilePath}`
        responseBodyFormat = 'zip'
      } else if (responseContentTypeLower.includes('text/event-stream')) {
        const sseFilePath = await SaveSseData.saveSseData(responseData.responseData, url, timestamp)
        parsedResponseBody = `file-reference:${sseFilePath}`
        responseBodyFormat = 'sse'
      } else {
        const compressionWorker = await CompressionWorker.getCompressionWorker()
        const result = await compressionWorker.invoke('Compression.decompressBody', responseData.responseData, responseContentEncoding)
        const decompressedBody = result.body
        responseWasCompressed = result.wasCompressed
        parsedResponseBody = parseJsonIfApplicable(decompressedBody, responseContentType)
        if (responseContentTypeLower.includes('application/json')) {
          responseBodyFormat = 'json'
        }
      }

      // @ts-ignore
      postData.response = {
        body: parsedResponseBody,
        bodyFormat: responseBodyFormat,
        headers: responseData.responseHeaders,
        rawBody: responseBodyFormat === 'zip' || responseBodyFormat === 'sse' ? undefined : responseData.responseData.toString('utf8'),
        statusCode: responseData.statusCode,
        statusMessage: responseData.statusMessage,
        wasCompressed: responseWasCompressed,
      }
    }

    await writeFile(filepath, JSON.stringify(postData, null, 2), 'utf8')
    console.log(`[Proxy] Saved POST body to ${filepath}`)
  } catch (error) {
    console.error('[Proxy] Failed to save POST body:', error)
  }
}
