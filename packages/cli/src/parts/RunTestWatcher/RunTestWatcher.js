import * as CreateFileWatcherWorkerAndListen from '../CreateFileWatcherWorkerAndListen/CreateFileWatcherWorkerAndListen.js'

export const state = {
  /**
   * @type {any}
   */
  fileWatcherWorker: undefined,
}

export const prepare = async (cwd) => {
  if (state.fileWatcherWorker) {
    // TODO race condition
    state.fileWatcherWorker = await CreateFileWatcherWorkerAndListen.createFileWatcherWorkerAndListen(cwd)
  }
  return state.fileWatcherWorker
}
