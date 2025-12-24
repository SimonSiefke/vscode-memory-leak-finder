import { createBrotliDecompress } from 'zlib'

export const decompressBrotli = async (body: Buffer): Promise<{ body: string; wasCompressed: boolean }> => {
  const { promise, reject, resolve } = Promise.withResolvers<{
    body: string
    wasCompressed: boolean
  }>()
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
