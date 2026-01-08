import { decompressBrotli } from '../DecompressBrotli/DecompressBrotli.ts'
import { decompressDeflate } from '../DecompressDeflate/DecompressDeflate.ts'
import { decompressGzip } from '../DecompressGzip/DecompressGzip.ts'
import { decompressZstd } from '../DecompressZstd/DecompressZstd.ts'

export const decompressBody = async (
  body: Buffer,
  encoding: string | string[] | undefined,
): Promise<{ body: Uint8Array; wasCompressed: boolean }> => {
  if (!encoding) {
    return { body: new Uint8Array(body), wasCompressed: false }
  }

  const encodingStr = Array.isArray(encoding) ? encoding[0] : encoding
  const normalizedEncoding = encodingStr.toLowerCase().trim()

  if (normalizedEncoding === 'gzip') {
    return decompressGzip(body)
  }

  if (normalizedEncoding === 'deflate') {
    return decompressDeflate(body)
  }

  if (normalizedEncoding === 'br') {
    return decompressBrotli(body)
  }

  if (normalizedEncoding === 'zstd') {
    return decompressZstd(body)
  }

  return { body: new Uint8Array(body), wasCompressed: false }
}
