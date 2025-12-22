import { decompress as zstdDecompress } from '@mongodb-js/zstd'
import { mkdir, writeFile } from 'fs/promises'
import type { IncomingMessage } from 'http'
import { join } from 'path'
import { createBrotliDecompress, createGunzip, createInflate } from 'zlib'
import { decompressBody } from '../DecompressBody/DecompressBody.ts'
import { parseJsonIfApplicable } from '../HttpProxyServer/HttpProxyServer.ts'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SaveSseData from '../SaveSseData/SaveSseData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const decompressBody = async (body: Buffer, encoding: string | string[] | undefined): Promise<{ body: string; wasCompressed: boolean }> => {
  if (!encoding) {
    return { body: body.toString('utf8'), wasCompressed: false }
  }

  const encodingStr = Array.isArray(encoding) ? encoding[0] : encoding
  const normalizedEncoding = encodingStr.toLowerCase().trim()

  if (normalizedEncoding === 'gzip') {
    return new Promise((resolve, reject) => {
      const gunzip = createGunzip()
      const chunks: Buffer[] = []
      gunzip.on('data', (chunk: Buffer) => chunks.push(chunk))
      gunzip.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      gunzip.on('error', reject)
      gunzip.write(body)
      gunzip.end()
    })
  }

  if (normalizedEncoding === 'deflate') {
    return new Promise((resolve, reject) => {
      const inflate = createInflate()
      const chunks: Buffer[] = []
      inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
      inflate.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      inflate.on('error', reject)
      inflate.write(body)
      inflate.end()
    })
  }

  if (normalizedEncoding === 'br') {
    return new Promise((resolve, reject) => {
      const brotli = createBrotliDecompress()
      const chunks: Buffer[] = []
      brotli.on('data', (chunk: Buffer) => chunks.push(chunk))
      brotli.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      brotli.on('error', reject)
      brotli.write(body)
      brotli.end()
    })
  }

  if (normalizedEncoding === 'zstd') {
    try {
      const decompressed = await zstdDecompress(body)
      return { body: decompressed.toString('utf8'), wasCompressed: true }
    } catch {
      // If decompression fails, return original body
      return { body: body.toString('utf8'), wasCompressed: false }
    }
  }

  return { body: body.toString('utf8'), wasCompressed: false }
}

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
      const { body: decompressedBody, wasCompressed: wasCompressedResult } = await decompressBody(responseData, contentEncoding)
      wasCompressed = wasCompressedResult
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
