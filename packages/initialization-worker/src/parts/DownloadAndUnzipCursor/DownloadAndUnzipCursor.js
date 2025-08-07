import * as DisableCursorWelcome from '../DisableCursorWelcome/DisableCursorWelcome.js'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'

export const downloadAndUnzipCursor = async (cursorVersion) => {
  const rpc = await DownloadWorker.launch()
  const cursorPath = await rpc.invoke('Download.downloadAndUnzipCursor', cursorVersion)
  await rpc.dispose()
  await DisableCursorWelcome.disableCursorWelcome()
  return cursorPath
}
