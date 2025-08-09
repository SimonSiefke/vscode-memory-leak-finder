import * as DisableCursorWelcome from '../DisableCursorWelcome/DisableCursorWelcome.ts'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

export const downloadAndUnzipCursor = async (cursorVersion) => {
  const rpc = await DownloadWorker.launch()
  const cursorPath = await rpc.invoke('Download.downloadAndUnzipCursor', cursorVersion)
  await rpc.dispose()
  await DisableCursorWelcome.disableCursorWelcome()
  return cursorPath
}
