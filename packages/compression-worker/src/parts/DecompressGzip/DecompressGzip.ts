import { createGunzip } from 'node:zlib'

export const decompressGzip = async (body: Buffer): Promise<{ body: Buffer; wasCompressed: boolean }> => {
  const { promise, reject, resolve } = Promise.withResolvers<{
    body: Buffer
    wasCompressed: boolean
  }>()
  const gunzip = createGunzip()
  const chunks: Buffer[] = []
  gunzip.on('data', (chunk: Buffer) => chunks.push(chunk))
  gunzip.on('end', () => {
    const decompressed = Buffer.concat(chunks)
    resolve({ body: decompressed, wasCompressed: true })
  })
  gunzip.on('error', reject)
  gunzip.write(body)
  gunzip.end()
  return promise
}
