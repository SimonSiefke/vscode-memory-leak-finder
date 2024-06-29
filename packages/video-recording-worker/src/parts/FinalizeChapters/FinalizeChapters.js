import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'
import * as VideoChapter from '../VideoChapter/VideoChapter.js'

const getMetaDataOptions = (baseName) => {
  return ['-i', baseName, '-i', 'metadata.txt', '-map_metadata', '1', '-codec', 'copy', '-y', 'out.webm']
}

const getChaptersData = (chapters) => {
  let start = 0
  let data = ''
  for (const chapter of chapters) {
    const end = chapter.time
    data += `[CHAPTER]
TIMEBASE=1/1000
START=${Math.round(start)}
END=${Math.round(end)}
title=${chapter.name}
`
    start = end
  }
  return data
}

const supportsNativeFfmpeg = () => {
  return existsSync('/usr/bin/ffmpeg')
}

export const finalizeChapters = async () => {
  if (!supportsNativeFfmpeg()) {
    return
  }
  const outFile = FfmpegProcessState.getOutFile()
  const ffmpegPath = 'ffmpeg'
  const baseName = basename(outFile)
  const folderName = dirname(outFile)
  const metaDataArgs = getMetaDataOptions(baseName)
  const chapters = VideoChapter.state.chapters
  const data = getChaptersData(chapters)
  const metaDataPath = join(folderName, 'metadata.txt')
  await writeFile(metaDataPath, data)
  const child = spawn(ffmpegPath, metaDataArgs, {
    cwd: folderName,
    stdio: 'inherit',
  })
  await new Promise((r) => {
    child.on('exit', r)
  })
}
