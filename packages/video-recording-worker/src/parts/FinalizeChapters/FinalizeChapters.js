import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.js'
import * as Exec from '../Exec/Exec.js'
import { basename, dirname } from 'path'

const getMetaDataOptions = (baseName) => {
  return ['-i', baseName, '-f', 'ffmetadata', 'metadata.txt']
}

export const finalizeChapters = async () => {
  const outFile = FfmpegProcessState.getOutFile()
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()

  const baseName = basename(outFile)
  const folderName = dirname(outFile)
  const metaDataArgs = getMetaDataOptions(baseName)
  await Exec.exec(ffmpegPath, metaDataArgs, {
    cwd: folderName,
  })
  console.log({ outFile })
  console.log('??')
}
