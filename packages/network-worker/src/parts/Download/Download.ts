import { VError } from '@lvce-editor/verror'
import got from 'got'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'

export const download = async (name: string, downloadUrl: string, outFile: string): Promise<void> => {
  try {
    await mkdir(dirname(outFile), { recursive: true })
    await pipeline(got.stream(downloadUrl), createWriteStream(outFile))
  } catch (error) {
    throw new VError(error, `Failed to download ${name}`)
  }
}
