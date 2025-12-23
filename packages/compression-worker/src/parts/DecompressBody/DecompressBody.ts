import { decompressGzip } from '../DecompressGzip/DecompressGzip.ts'
import { decompressDeflate } from '../DecompressDeflate/DecompressDeflate.ts'
import { decompressBrotli } from '../DecompressBrotli/DecompressBrotli.ts'
import { decompressZstd } from '../DecompressZstd/DecompressZstd.ts'

export const decompressBody = async (
  body: Buffer,
  encoding: string | string[] | undefined,
): Promise<{ body: string; wasCompressed: boolean }> => {
  if (!encoding) {
    return { body: body.toString('utf8'), wasCompressed: false }
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

  return { body: body.toString('utf8'), wasCompressed: false }
}
