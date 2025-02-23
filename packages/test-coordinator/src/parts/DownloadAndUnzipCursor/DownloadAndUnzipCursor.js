import * as DisableCursorWelcome from '../DisableCursorWelcome/DisableCursorWelcome.js'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const downloadAndUnzipCursor = async () => {
  const ipc = await DownloadWorker.launch()
  const cursorPath = await JsonRpc.invoke(ipc, 'Download.downloadAndUnzipCursor')
  ipc.dispose()
  await DisableCursorWelcome.disableCursorWelcome()
  return cursorPath
}
