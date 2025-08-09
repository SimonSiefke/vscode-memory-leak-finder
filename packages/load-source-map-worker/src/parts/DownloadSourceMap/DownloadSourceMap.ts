import got from 'got'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'

export const downloadSourceMap = async (url: string, outFilePath: string): Promise<void> => {
  await mkdir(dirname(outFilePath), { recursive: true })
  await pipeline(got.stream(url), createWriteStream(outFilePath))
}
