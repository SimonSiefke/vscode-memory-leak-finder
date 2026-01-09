import { decompress as zstdDecompress } from '@mongodb-js/zstd'

export const decompressZstd = async (body: Buffer): Promise<{ body: Uint8Array; wasCompressed: boolean }> => {
  try {
    const decompressed = await zstdDecompress(body)
    return { body: decompressed instanceof Buffer ? new Uint8Array(decompressed) : decompressed, wasCompressed: true }
  } catch {
    // If decompression fails, return original body
    return { body: new Uint8Array(body), wasCompressed: false }
  }
}
