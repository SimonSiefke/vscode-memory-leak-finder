import { existsSync } from 'fs'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.ts'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'

export const intialize = async () => {
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()
  if (existsSync(ffmpegPath)) {
    return
  }
  console.log('[downloading ffmpeg]')
  const rpc = await DownloadWorker.launch()
  await rpc.invoke('Download.downloadFfmpegMaybe')
  await rpc.dispose()
}
