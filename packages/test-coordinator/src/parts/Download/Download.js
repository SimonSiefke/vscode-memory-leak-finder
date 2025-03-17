import { VError } from '@lvce-editor/verror'
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import got from 'got'
import { dirname } from 'path'
import { pipeline } from 'stream/promises'

export const download = async (name, downloadUrl, outFile) => {
  try {
    await mkdir(dirname(outFile), { recursive: true })
    await pipeline(got.stream(downloadUrl), createWriteStream(outFile))
  } catch (error) {
    throw new VError(error, `Failed to download ${name}`)
  }
}
