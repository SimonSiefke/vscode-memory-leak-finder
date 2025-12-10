import { IncomingMessage } from 'http'
import { createGunzip, createInflate, createBrotliDecompress } from 'zlib'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const sanitizeFilename = (url: string): string => {
  return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200)
}

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
    } catch (error) {
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
    const filename = `${timestamp}_${sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const contentEncoding = responseHeaders['content-encoding'] || responseHeaders['Content-Encoding']
    const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type']
    const { body: decompressedBody, wasCompressed } = await decompressBody(responseData, contentEncoding)

    const parsedBody = parseJsonIfApplicable(decompressedBody, contentType)

    const requestData = {
      timestamp,
      method: req.method,
      url: req.url,
      headers: req.headers,
      response: {
        statusCode,
        statusMessage,
        headers: responseHeaders,
        body: parsedBody,
        wasCompressed,
      },
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved request to ${filepath}`)
  } catch (error) {
    // Ignore errors when saving requests
    console.error('[Proxy] Failed to save request:', error)
  }
}
