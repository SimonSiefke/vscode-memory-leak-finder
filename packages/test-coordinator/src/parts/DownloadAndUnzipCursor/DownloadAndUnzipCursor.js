import * as DisableCursorWelcome from '../DisableCursorWelcome/DisableCursorWelcome.js'
import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const downloadAndUnzipCursor = async () => {
  const cursorVersion = '0.45.14' // TODO make it configurable
  const ipc = await DownloadWorker.launch()
  const cursorPath = await JsonRpc.invoke(ipc, 'Download.downloadAndUnzipCursor', cursorVersion)
  ipc.dispose()
  await DisableCursorWelcome.disableCursorWelcome()
  return cursorPath
}
