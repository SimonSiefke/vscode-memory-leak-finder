import { VError } from '@lvce-editor/verror'
import got from 'got'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'

export const downloadSourceMap = async (url: string, outFilePath: string): Promise<void> => {
  try {
    await mkdir(dirname(outFilePath), { recursive: true })
    await pipeline(got.stream(url), createWriteStream(outFilePath))
  } catch (error) {
    throw new VError(error, `Failed to download source map from ${url}`)
  }
}
