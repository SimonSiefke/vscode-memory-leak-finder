import { createInflate } from 'node:zlib'

export const decompressDeflate = async (body: Buffer): Promise<{ body: Buffer; wasCompressed: boolean }> => {
  const { promise, reject, resolve } = Promise.withResolvers<{
    body: Buffer
    wasCompressed: boolean
  }>()
  const inflate = createInflate()
  const chunks: Buffer[] = []
  inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
  inflate.on('end', () => {
    const decompressed = Buffer.concat(chunks)
    resolve({ body: decompressed, wasCompressed: true })
  })
  inflate.on('error', reject)
  inflate.write(body)
  inflate.end()
  return promise
}
