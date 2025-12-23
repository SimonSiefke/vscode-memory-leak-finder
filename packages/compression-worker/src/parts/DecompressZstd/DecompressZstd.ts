import { decompress as zstdDecompress } from '@mongodb-js/zstd'

export const decompressZstd = async (body: Buffer): Promise<{ body: string; wasCompressed: boolean }> => {
  try {
    const decompressed = await zstdDecompress(body)
    return { body: decompressed.toString('utf8'), wasCompressed: true }
  } catch {
    // If decompression fails, return original body
    return { body: body.toString('utf8'), wasCompressed: false }
  }
}
