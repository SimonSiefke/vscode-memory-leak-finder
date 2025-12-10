import { createGunzip, createInflate, createBrotliDecompress } from 'zlib'
import { decompress as zstdDecompress } from '@mongodb-js/zstd'

export const decompressBody = async (body: Buffer, encoding: string | string[] | undefined): Promise<{ body: string; wasCompressed: boolean }> => {
  if (!encoding) {
    return { body: body.toString('utf8'), wasCompressed: false }
  }

  const encodingStr = Array.isArray(encoding) ? encoding[0] : encoding
  const normalizedEncoding = encodingStr.toLowerCase().trim()

  if (normalizedEncoding === 'gzip') {
    const { promise, resolve, reject } = Promise.withResolvers<{ body: string; wasCompressed: boolean }>()
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
    return promise
  }

  if (normalizedEncoding === 'deflate') {
    const { promise, resolve, reject } = Promise.withResolvers<{ body: string; wasCompressed: boolean }>()
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
    return promise
  }

  if (normalizedEncoding === 'br') {
    const { promise, resolve, reject } = Promise.withResolvers<{ body: string; wasCompressed: boolean }>()
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
    return promise
  }

  if (normalizedEncoding === 'zstd') {
    try {
      const decompressed = await zstdDecompress(body)
      return { body: decompressed.toString('utf8'), wasCompressed: true }
    } catch (error) {
      // If decompression fails, return original body
      return { body: body.toString('utf8'), wasCompressed: false }
    }
  }

  return { body: body.toString('utf8'), wasCompressed: false }
}

