import { existsSync } from 'fs'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.ts'

export const intialize = () => {
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()
  if (existsSync(ffmpegPath)) {
    return
  }
  console.log('downloading ffmpeg')
  // TODO download ffmpeg
}
