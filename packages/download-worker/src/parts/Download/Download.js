import { VError } from '@lvce-editor/verror'
import { createWriteStream } from 'fs'
import got from 'got'
import { pipeline } from 'stream/promises'

export const download = async (name, downloadUrls, outFile) => {
  try {
    const downloadUrl = downloadUrls[0]
    console.log({ outFile, downloadUrl })
    await pipeline(got.stream(downloadUrl), createWriteStream(outFile))
  } catch (error) {
    throw new VError(error, `Failed to download ${name}`)
  }
}
