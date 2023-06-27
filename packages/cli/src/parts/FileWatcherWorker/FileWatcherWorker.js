import * as Assert from '../Assert/Assert.js'
import * as GetFileWatcherWorkerUrl from '../GetFileWatcherWorkerUrl/GetFileWatcherWorkerUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import { VError } from '../VError/VError.js'

export const listen = async (method) => {
  try {
    Assert.number(method)
    const url = GetFileWatcherWorkerUrl.getFileWatcherWorkerUrl()
    const ipc = await IpcParent.create({
      method,
      url,
      stdio: 'inherit',
    })
    return ipc
  } catch (error) {
    throw new VError(error, `Failed to create file watcher worker`)
  }
}
