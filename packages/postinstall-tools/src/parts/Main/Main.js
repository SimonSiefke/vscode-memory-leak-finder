import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const main = async () => {
  const ipc = await DownloadWorker.launch()
  await JsonRpc.invoke(ipc, 'Download.downloadFfmpegMaybe')
  ipc.dispose()
}
