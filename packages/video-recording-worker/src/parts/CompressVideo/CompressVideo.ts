import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { rename } from 'node:fs/promises'
import * as Exec from '../Exec/Exec.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'

const supportsNativeFfmpeg = (): boolean => {
  return existsSync('/usr/bin/ffmpeg')
}

const getCompressOptions = (inputFile: string, outputFile: string): readonly string[] => {
  return [
    '-i',
    inputFile,
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '0',
    '-b:v',
    '0',
    '-lossless',
    '1',
    '-map_metadata',
    '0',
    '-threads',
    '0',
    '-y',
    outputFile,
  ]
}

export const compressVideo = async (): Promise<void> => {
  if (!supportsNativeFfmpeg()) {
    return
  }
  const outFile = FfmpegProcessState.getOutFile()
  const ffmpegPath = 'ffmpeg'
  const folderName = dirname(outFile)
  // After FinalizeChapters, the final video might be 'out.webm' or the original file
  const possibleFinalFile = join(folderName, 'out.webm')
  const inputFile = existsSync(possibleFinalFile) ? 'out.webm' : basename(outFile)
  const compressedFileName = 'compressed.webm'
  const compressedFilePath = join(folderName, compressedFileName)
  const compressArgs = getCompressOptions(inputFile, compressedFileName)
  await Exec.exec(ffmpegPath, compressArgs, {
    cwd: folderName,
  })
  // Replace the final file with compressed version
  const finalFile = existsSync(possibleFinalFile) ? possibleFinalFile : outFile
  await rename(compressedFilePath, finalFile)
}

