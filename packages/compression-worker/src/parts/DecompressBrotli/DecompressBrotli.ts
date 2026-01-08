import { createBrotliDecompress } from 'node:zlib'

export const decompressBrotli = async (body: Buffer): Promise<{ body: Uint8Array; wasCompressed: boolean }> => {
  const { promise, reject, resolve } = Promise.withResolvers<{
    body: Uint8Array
    wasCompressed: boolean
  }>()
  const brotli = createBrotliDecompress()
  const chunks: Buffer[] = []
  brotli.on('data', (chunk: Buffer) => chunks.push(chunk))
  brotli.on('end', () => {
    const decompressed = Buffer.concat(chunks)
    resolve({ body: new Uint8Array(decompressed), wasCompressed: true })
  })
  brotli.on('error', reject)
  brotli.write(body)
  brotli.end()
  return promise
}
