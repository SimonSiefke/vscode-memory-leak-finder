import * as Assert from '../Assert/Assert.js'
import * as FileWatcherWorker from '../FileWatcherWorker/FileWatcherWorker.js'
import * as FileWatcherWorkerCommandType from '../FileWatcherWorkerCommandType/FileWatcherWorkerCommandType.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as RunTestWatcher from '../RunTestWatcher/RunTestWatcher.js'

export const createFileWatcherWorkerAndListen = async (cwd) => {
  Assert.string(cwd)
  const fileWatcherWorker = await FileWatcherWorker.listen(IpcParentType.NodeWorkerThread)
  HandleIpc.handleIpc(fileWatcherWorker)
  JsonRpc.send(RunTestWatcher.state.fileWatcherWorker, FileWatcherWorkerCommandType.WatchFolder, cwd)
}
