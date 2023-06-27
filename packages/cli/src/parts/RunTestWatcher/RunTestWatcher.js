import * as FileWatcherWorker from '../FileWatcherWorker/FileWatcherWorker.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const state = {
  /**
   * @type {any}
   */
  fileWatcherWorker: undefined,
}

export const prepareWatcher = async () => {
  if (state.fileWatcherWorker) {
    return true
  }
  // TODO race condition
  const fileWatcherWorker = await FileWatcherWorker.listen(IpcParentType.NodeWorkerThread)
  HandleIpc.handleIpc(fileWatcherWorker)
  state.fileWatcherWorker = fileWatcherWorker
  return false
}
