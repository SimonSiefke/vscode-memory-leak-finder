import { decompress as zstdDecompress } from '@mongodb-js/zstd'

export const decompressZstd = async (body: Buffer): Promise<{ body: Buffer; wasCompressed: boolean }> => {
  try {
    const decompressed = await zstdDecompress(body)
    return { body: decompressed, wasCompressed: true }
  } catch {
    // If decompression fails, return original body
    return { body: body, wasCompressed: false }
  }
}
