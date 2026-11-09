import { zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import { promisify } from 'node:util'

const zstdDecompress = promisify(zstdDecompressCallback)

export const decompressZstd = async (body: Buffer): Promise<{ body: Uint8Array; wasCompressed: boolean }> => {
  try {
    const decompressed = await zstdDecompress(body)
    return { body: new Uint8Array(decompressed), wasCompressed: true }
  } catch {
    // If decompression fails, return original body
    return { body: new Uint8Array(body), wasCompressed: false }
  }
}
