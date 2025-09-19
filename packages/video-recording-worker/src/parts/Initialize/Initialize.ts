import { existsSync } from 'fs'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.ts'
import * as TestEventTracker from '../TestEventTracker/TestEventTracker.ts'

export const intialize = async () => {
  TestEventTracker.initialize()
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()
  if (existsSync(ffmpegPath)) {
    return
  }
  const rpc = await DownloadWorker.launch()
  await rpc.invoke('Download.downloadFfmpegMaybe')
  await rpc.dispose()
}
