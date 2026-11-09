import { expect, test } from '@jest/globals'
import { zstdCompress as zstdCompressCallback } from 'node:zlib'
import { promisify } from 'node:util'
import { decompressZstd } from '../src/parts/DecompressZstd/DecompressZstd.ts'

const zstdCompress = promisify(zstdCompressCallback)

test('decompresses a zstd-compressed body', async () => {
  const input = Buffer.from('compressed response body')
  const compressed = await zstdCompress(input)

  const result = await decompressZstd(compressed)

  expect(result).toEqual({ body: new Uint8Array(input), wasCompressed: true })
})

test('returns the original body when zstd decompression fails', async () => {
  const input = Buffer.from('not compressed')

  const result = await decompressZstd(input)

  expect(result).toEqual({ body: new Uint8Array(input), wasCompressed: false })
})
