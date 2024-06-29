import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'
import * as Exec from '../Exec/Exec.js'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'
import * as VideoChapter from '../VideoChapter/VideoChapter.js'

const getMetaDataInputOptions = (baseName) => {
  return ['-i', baseName, '-i', '-y', 'meta.ffmeta']
}

const getMetaDataOutputOptions = (baseName) => {
  return ['-i', baseName, '-i', 'metadata.txt', '-map_metadata', '1', '-codec', 'copy', '-y', 'out.webm']
}

const getChaptersData = (previousMetaData, chapters) => {
  let start = 0
  let data = previousMetaData + '\n'
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
  const metaDataInputArgs = getMetaDataInputOptions(baseName)
  await Exec.exec(ffmpegPath, metaDataInputArgs, {
    cwd: folderName,
  })
  const previousMetaData = await readFile(join(folderName, 'meta.ffmeta'))
  const chapters = VideoChapter.state.chapters
  const data = getChaptersData(previousMetaData, chapters)
  const metaDataPath = join(folderName, 'metadata.txt')
  const metaDataArgs = getMetaDataOutputOptions(baseName)
  await writeFile(metaDataPath, data)
  await Exec.exec(ffmpegPath, metaDataArgs, {
    cwd: folderName,
  })
}
