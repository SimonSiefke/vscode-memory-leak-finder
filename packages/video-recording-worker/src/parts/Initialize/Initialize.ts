import { existsSync } from 'node:fs'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.ts'

export const initialize = async (platform: string, arch: string) => {
  const ffmpegPath = GetFfmpegPath.getFfmpegPath(platform)
  if (existsSync(ffmpegPath)) {
    return
  }
  await using rpc = await DownloadWorker.launch()
  await rpc.invoke('Download.downloadFfmpegMaybe', platform, arch)
}
